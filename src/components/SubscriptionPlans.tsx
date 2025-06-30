import React, { useState } from 'react';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PRICING_PLANS, PricingTier } from '../lib/stripe';
import toast from 'react-hot-toast';

interface SubscriptionPlansProps {
  onClose?: () => void;
  showCurrentPlan?: boolean;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ 
  onClose, 
  showCurrentPlan = true 
}) => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState<PricingTier | null>(null);

  const handleUpgrade = async (tier: PricingTier) => {
    if (!user || !profile) {
      toast.error('Please sign in to upgrade');
      return;
    }

    if (profile.subscription_tier === tier) {
      toast.error('You are already on this plan');
      return;
    }

    setLoading(tier);
    
    try {
      const { createCheckoutSession } = await import('../lib/stripe');
      const getStripe = (await import('../lib/stripe')).default;
      
      const sessionId = await createCheckoutSession(
        PRICING_PLANS[tier].priceId, 
        profile.email, 
        profile.id
      );
      
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe not loaded');
      }
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
      
    } catch (error: any) {
      console.error('Error starting checkout:', error);
      toast.error(error.message || 'Failed to start checkout process');
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!profile?.stripe_customer_id) {
      toast.error('No billing information found');
      return;
    }

    try {
      const { createPortalSession } = await import('../lib/stripe');
      const portalUrl = await createPortalSession(profile.stripe_customer_id);
      window.open(portalUrl, '_blank');
      
    } catch (error: any) {
      console.error('Error opening billing portal:', error);
      toast.error(error.message || 'Failed to open billing portal');
    }
  };

  const getPlanIcon = (tier: PricingTier) => {
    switch (tier) {
      case 'basic': return <Zap className="w-6 h-6" />;
      case 'standard': return <Star className="w-6 h-6" />;
      case 'professional': return <Crown className="w-6 h-6" />;
    }
  };

  const getPlanColor = (tier: PricingTier) => {
    switch (tier) {
      case 'basic': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'standard': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'professional': return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  const isCurrentPlan = (tier: PricingTier) => {
    return profile?.subscription_tier === tier;
  };

  const canUpgrade = (tier: PricingTier) => {
    if (!profile) return false;
    
    const tierOrder: Record<string, number> = {
      'free': 0,
      'basic': 1,
      'standard': 2,
      'professional': 3
    };
    
    return tierOrder[profile.subscription_tier] < tierOrder[tier];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-lg text-gray-600">
          Upgrade to unlock more PDFs and advanced features
        </p>
        
        {/* Current Plan Badge */}
        {showCurrentPlan && profile && (
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Current Plan: {profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)}
            {profile.subscription_tier !== 'free' && (
              <span className="ml-2 text-xs">
                • {profile.pdf_count_used} PDFs used this month
              </span>
            )}
          </div>
        )}
      </div>

      {/* Free Plan */}
      <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                <Check className="w-5 h-5 text-gray-600" />
              </div>
              Free Plan
            </h3>
            <p className="text-gray-600 mt-1">Perfect for trying AtomicPDF</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                1 PDF per month
              </span>
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                Basic editing
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">Free</div>
            {isCurrentPlan('free' as PricingTier) && (
              <span className="text-sm text-green-600 font-medium">Current Plan</span>
            )}
          </div>
        </div>
      </div>

      {/* Paid Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(PRICING_PLANS).map(([tierKey, plan]) => {
          const tier = tierKey as PricingTier;
          const isCurrent = isCurrentPlan(tier);
          const canUpgradeToPlan = canUpgrade(tier);
          
          return (
            <div
              key={tier}
              className={`relative p-6 rounded-lg border-2 transition-all ${
                plan.popular
                  ? 'border-purple-300 ring-2 ring-purple-100'
                  : isCurrent
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center">
                {/* Plan Icon */}
                <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-4 ${getPlanColor(tier)}`}>
                  {getPlanIcon(tier)}
                </div>

                {/* Plan Name */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 text-sm text-left">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <button
                  onClick={() => handleUpgrade(tier)}
                  disabled={!canUpgradeToPlan || loading === tier}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    isCurrent
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : canUpgradeToPlan
                      ? plan.popular
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading === tier ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : canUpgradeToPlan ? (
                    'Upgrade Now'
                  ) : (
                    'Downgrade'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Billing Management */}
      {profile && profile.subscription_tier !== 'free' && (
        <div className="mt-8 text-center">
          <button
            onClick={handleManageBilling}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Manage Billing & Subscription →
          </button>
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5 mr-3">
            <Check className="w-3 h-3 text-white" />
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Secure Payment Processing</p>
            <p>All payments are processed securely through Stripe. Your payment information is never stored on our servers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans; 