import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, customerEmail, userId, successUrl, cancelUrl } = req.body;

    // Validate required fields
    if (!priceId || !customerEmail || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get or create Stripe customer
    let customer;
    
    // First check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', userId)
      .single();

    if (profile?.stripe_customer_id) {
      // Use existing customer
      customer = await stripe.customers.retrieve(profile.stripe_customer_id);
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: customerEmail,
        name: profile?.full_name || customerEmail.split('@')[0],
        metadata: {
          supabase_user_id: userId
        }
      });

      // Update profile with Stripe customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.REACT_APP_APP_URL || 'https://atomicpdf.org'}/editor?success=true`,
      cancel_url: cancelUrl || `${process.env.REACT_APP_APP_URL || 'https://atomicpdf.org'}/editor?canceled=true`,
      subscription_data: {
        metadata: {
          supabase_user_id: userId
        }
      },
      customer_update: {
        name: 'auto',
        address: 'auto'
      },
      tax_id_collection: {
        enabled: true
      },
      automatic_tax: {
        enabled: false
      }
    });

    res.status(200).json({ sessionId: session.id });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
} 