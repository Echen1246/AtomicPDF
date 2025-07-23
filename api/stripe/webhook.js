import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('--- STRIPE WEBHOOK INVOCATION START ---');
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  console.log('Webhook secret is set:', !!webhookSecret);
  
  let event;

  try {
    const rawBody = await buffer(req);
    console.log('Received raw body length:', rawBody.length);
    console.log('Received stripe-signature header:', sig);

    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    console.log('SUCCESS: Stripe event constructed:', event.type, event.id);
  } catch (err) {
    console.error('ERROR: Webhook signature verification failed.', err);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`Processing event type: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Handling checkout.session.completed...');
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
        
      case 'customer.created':
      case 'customer.updated':
        await handleCustomerChange(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    console.log('--- STRIPE WEBHOOK INVOCATION END: SUCCESS ---');
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('ERROR: Webhook handler failed.', {
      eventType: event.type,
      errorMessage: error.message,
      errorStack: error.stack,
    });
    console.log('--- STRIPE WEBHOOK INVOCATION END: FAILED ---');
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutSessionCompleted(session) {
  console.log('Inside handleCheckoutSessionCompleted. Session ID:', session.id);
  console.log('Session mode:', session.mode);
  console.log('Session payment_status:', session.payment_status);

  // This handles one-time payments
  if (session.mode === 'payment' && session.payment_status === 'paid') {
    const userId = session.metadata?.supabase_user_id;
    
    console.log('User ID from metadata:', userId);

    if (!userId) {
      console.error('CRITICAL: No supabase_user_id found in session metadata.');
      return;
    }

    console.log(`Attempting to update profile for user: ${userId} to 'lifetime' tier.`);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: 'lifetime',
        subscription_status: 'active', // or 'lifetime'
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('ERROR: Supabase profile update failed.', {
        userId: userId,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
      });
      throw new Error(`Supabase update failed: ${error.message}`);
    }
    
    console.log(`SUCCESS: Supabase profile updated for user ${userId}.`);
    console.log('Updated profile data:', data);
  } else {
    console.log('Skipping profile update: session mode is not "payment" or payment_status is not "paid".');
  }
}


async function handleSubscriptionChange(subscription) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const priceId = subscription.items.data[0].price.id;
  
  // Map Stripe price IDs to your tiers
  const tierMapping = {
    // Legacy Plans (for existing subscribers)
    'price_1RiQG6DG3wjiUUIB5rrU7y1O': 'basic',
    'price_1RiQGgDG3wjiUUIBoHmt1n4v': 'standard', 
    'price_1RiQH5DG3wjiUUIBm99OIXVG': 'professional'
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
      stripe_product_id: subscription.items.data[0].price.product,
      tier: tier,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
    }, {
      onConflict: 'stripe_subscription_id'
    });

  if (subError) throw subError;

  // Update profile
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
    
    // Also update profile status
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (sub) {
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.user_id);
    }
    
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
    
    // Also update profile status
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (sub) {
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.user_id);
    }
    
    console.log(`Payment failed for subscription: ${subscriptionId}`);
  }
}

async function handleCustomerChange(customer) {
  // Update customer information in profiles if needed
  const { error } = await supabase
    .from('profiles')
    .update({
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customer.id);

  if (error) {
    console.error('Error updating customer profile:', error);
  } else {
    console.log(`Updated customer: ${customer.id}`);
  }
} 