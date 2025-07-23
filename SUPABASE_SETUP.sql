-- =====================================================
-- AtomicPDF Supabase Database Setup
-- Run these commands in Supabase SQL Editor
-- =====================================================

-- 1. Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'basic', 'standard', 'professional')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
    stripe_customer_id VARCHAR(255) UNIQUE,
    pdf_count_used INTEGER DEFAULT 0 CHECK (pdf_count_used >= 0),
    pdf_count_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create subscriptions table for Stripe data
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
    stripe_price_id VARCHAR(255) NOT NULL,
    stripe_product_id VARCHAR(255),
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('pro', 'basic', 'standard', 'professional')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create usage logs table for analytics (optional but recommended)
CREATE TABLE public.usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'pdf_upload', 'pdf_export', 'annotation_add', etc.
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create subscription history table for audit trail
CREATE TABLE public.subscription_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'renewed'
    old_tier VARCHAR(20),
    new_tier VARCHAR(20),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    stripe_event_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Usage logs policies
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage logs" ON public.usage_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Subscription history policies
CREATE POLICY "Users can view own subscription history" ON public.subscription_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscription history" ON public.subscription_history
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly PDF count
CREATE OR REPLACE FUNCTION public.reset_monthly_pdf_counts()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        pdf_count_used = 0,
        pdf_count_reset_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE pdf_count_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync subscription tier with profile
CREATE OR REPLACE FUNCTION public.sync_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profile with new subscription tier
    UPDATE public.profiles 
    SET 
        subscription_tier = NEW.tier,
        subscription_status = NEW.status,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- Log the change
    INSERT INTO public.subscription_history (
        user_id, 
        subscription_id, 
        action, 
        new_tier, 
        new_status,
        metadata
    ) VALUES (
        NEW.user_id, 
        NEW.id, 
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'created'
            WHEN TG_OP = 'UPDATE' AND OLD.tier != NEW.tier THEN 'tier_changed'
            WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'status_changed'
            ELSE 'updated'
        END,
        NEW.tier, 
        NEW.status,
        jsonb_build_object(
            'stripe_subscription_id', NEW.stripe_subscription_id,
            'stripe_price_id', NEW.stripe_price_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Trigger for updated_at on profiles
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for updated_at on subscriptions
CREATE TRIGGER handle_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to create profile on user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger to sync subscription changes to profile
CREATE TRIGGER sync_subscription_to_profile
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_subscription_tier();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes on profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- Indexes on subscriptions
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON public.subscriptions(tier);

-- Indexes on usage_logs
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_action ON public.usage_logs(action);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at);

-- Indexes on subscription_history
CREATE INDEX idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX idx_subscription_history_action ON public.subscription_history(action);

-- =====================================================
-- SETUP COMPLETE MESSAGE
-- =====================================================

-- Insert a test to verify everything works
DO $$
BEGIN
    RAISE NOTICE 'AtomicPDF database setup completed successfully!';
    RAISE NOTICE 'Tables created: profiles, subscriptions, usage_logs, subscription_history';
    RAISE NOTICE 'RLS policies enabled and configured';
    RAISE NOTICE 'Triggers and functions created';
    RAISE NOTICE 'Ready for Google OAuth integration!';
END $$; 