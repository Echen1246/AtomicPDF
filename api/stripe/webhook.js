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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;

  try {
    // Use micro's buffer to read the raw body properly in Vercel
    const rawBody = await buffer(req);
    
    console.log('Webhook received - Body length:', rawBody.length);
    console.log('Webhook signature:', sig);
    console.log('Using webhook secret:', webhookSecret ? 'Yes (length: ' + webhookSecret.length + ')' : 'No');
    
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    console.log('Webhook event constructed successfully:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    console.error('Error details:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    console.log('Processing webhook event:', event.type);
    
    switch (event.type) {
      case 'checkout.session.completed':
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

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutSessionCompleted(session) {
  // This handles one-time payments
  if (session.mode === 'payment' && session.payment_status === 'paid') {
    const userId = session.metadata?.supabase_user_id || session.client_reference_id;
    if (!userId) {
      console.error('No user ID found in checkout session metadata:', session.id);
      return;
    }

    // You might want to get the priceId to be more specific about what was purchased
    // For now, we assume any one-time payment in this app is for the unlimited tier.
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: 'pro',
        subscription_status: 'active', // or 'lifetime'
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error(`Failed to update profile for user ${userId} to pro tier`, error);
      throw error;
    }
    console.log(`Updated user ${userId} to pro tier after one-time payment.`);
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