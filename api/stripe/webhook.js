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
  // This function is now effectively deprecated as we only have one-time payments for new customers.
  // We keep it here to handle any potential lingering events from legacy subscriptions.
  console.log('handleSubscriptionChange called for legacy subscription:', subscription.id);
}

async function handleSubscriptionCancellation(subscription) {
  // This function is now effectively deprecated
  console.log('handleSubscriptionCancellation called for legacy subscription:', subscription.id);
}

async function handlePaymentSuccess(invoice) {
  // This function is now effectively deprecated for new purchases
  console.log('handlePaymentSuccess called for legacy subscription invoice:', invoice.id);
}

async function handlePaymentFailure(invoice) {
  // This function is now effectively deprecated
  console.log('handlePaymentFailure called for legacy subscription invoice:', invoice.id);
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