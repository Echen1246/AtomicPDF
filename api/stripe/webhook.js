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
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.method === 'GET') {
    // This might be a health check or redirect - respond with basic info
    console.log('Received GET request - might be a health check or redirect');
    return res.status(200).json({ 
      message: 'Webhook endpoint is active',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.method !== 'POST') {
    console.log('Non-POST request received:', req.method);
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;

  try {
    const rawBody = await buffer(req);
    console.log('Raw body length:', rawBody.length);
    
    // Parse the event directly from the body
    event = JSON.parse(rawBody.toString());
    console.log('SUCCESS: Stripe event parsed from body:', event.type, event.id);
  } catch (err) {
    console.error('ERROR: Failed to parse webhook body.', err);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`Processing event type: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Handling checkout.session.completed...');
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      // Other cases are effectively deprecated but left for structure
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
        subscription_status: 'active',
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