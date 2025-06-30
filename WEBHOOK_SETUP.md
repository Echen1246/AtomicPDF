# Stripe Webhook Setup Guide

## 🎯 **Overview**
Webhooks keep your Supabase database synchronized with Stripe subscription events. When users upgrade, downgrade, or cancel subscriptions, Stripe sends events to your webhook endpoint.

## 📋 **Step 1: Configure Webhook in Stripe Dashboard**

1. **Go to Stripe Dashboard** → Webhooks → "Add endpoint"

2. **Endpoint URL**: 
   - **Local Development**: `https://your-ngrok-url.ngrok.io/api/stripe/webhook`
   - **Production**: `https://your-domain.com/api/stripe/webhook`

3. **Events to Send** (select these specific events):
   ```
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   invoice.payment_succeeded
   invoice.payment_failed
   customer.created
   customer.updated
   ```

4. **Copy the Webhook Signing Secret** (starts with `whsec_`)

## 🔧 **Step 2: Backend Options**

You have several options for implementing the webhook endpoint:

### Option A: Netlify Functions (Recommended)
- Easy deployment with your React app
- Serverless, pay-per-use
- Good for this use case

### Option B: Vercel API Routes
- Similar to Netlify, serverless
- Integrates well with React apps

### Option C: Express.js Server
- Traditional server approach
- More control, but requires hosting

### Option D: Supabase Edge Functions
- Native Supabase integration
- TypeScript/Deno runtime

## 🚀 **Step 3: Implementation (Netlify Functions Example)**

### Environment Variables
Add to your `.env` and Netlify environment:
```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Supabase (for server-side operations)
SUPABASE_URL=https://nnsfkiljuhivxpqrqhul.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Webhook Handler Code
Create `netlify/functions/stripe-webhook.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid signature' })
    };
  }

  try {
    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(stripeEvent.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(stripeEvent.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(stripeEvent.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailure(stripeEvent.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Webhook handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook handler failed' })
    };
  }
};

async function handleSubscriptionChange(subscription) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const priceId = subscription.items.data[0].price.id;
  
  // Map Stripe price IDs to your tiers
  const tierMapping = {
    'price_1RfWLyDG3wjiUUIB8eqsutL2': 'basic',
    'price_1RfWMrDG3wjiUUIBoqAYwRUb': 'standard', 
    'price_1RfWShDG3wjiUUIBppj9ct4X': 'professional'
  };
  
  const tier = tierMapping[priceId];
  if (!tier) {
    throw new Error(`Unknown price ID: ${priceId}`);
  }

  // Find user by Stripe customer ID
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single();

  if (findError || !profile) {
    throw new Error(`Profile not found for customer: ${customerId}`);
  }

  // Update or create subscription record
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: profile.id,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      tier: tier,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
    }, {
      onConflict: 'stripe_subscription_id'
    });

  if (subError) throw subError;

  // Update profile (triggers will sync subscription_tier)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_status: subscription.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id);

  if (profileError) throw profileError;

  console.log(`Updated subscription for user ${profile.id} to ${tier}`);
}

async function handleSubscriptionCancellation(subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) throw error;

  // Update profile to free tier if subscription ends immediately
  if (!subscription.cancel_at_period_end) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (sub) {
      await supabase
        .from('profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.user_id);
    }
  }

  console.log(`Canceled subscription: ${subscription.id}`);
}

async function handlePaymentSuccess(invoice) {
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) throw error;
    console.log(`Payment succeeded for subscription: ${subscriptionId}`);
  }
}

async function handlePaymentFailure(invoice) {
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) throw error;
    console.log(`Payment failed for subscription: ${subscriptionId}`);
  }
}
```

## 🧪 **Step 4: Local Testing**

### Install Stripe CLI
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to your local endpoint
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

### Test with ngrok (Alternative)
```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 8888

# Use the ngrok URL in your Stripe webhook configuration
```

## 📝 **Step 5: Deploy & Verify**

1. **Deploy your function** to Netlify/Vercel
2. **Update webhook URL** in Stripe Dashboard to production URL
3. **Test with real subscription** or use Stripe's webhook testing tool
4. **Monitor webhook delivery** in Stripe Dashboard

## 🔐 **Security Checklist**
- [x] Webhook signature verification implemented
- [x] Service role key used for Supabase operations
- [x] Error handling and logging in place
- [x] Environment variables secured

## 🚨 **Common Issues**
- **Signature verification fails**: Check webhook secret and raw body
- **User not found**: Ensure Stripe customer ID is set in profiles
- **Subscription not updating**: Check price ID mapping
- **Timeout errors**: Webhooks must respond within 10 seconds

## 🎯 **Next Steps**
After webhooks are working:
1. Implement checkout session creation
2. Add customer portal integration  
3. Test the complete subscription flow
4. Monitor webhook delivery in production 