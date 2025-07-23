import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log('=== CHECKOUT SESSION DEBUG START ===');
  console.log('Method:', req.method);
  console.log('Environment variables check:');
  console.log('- STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
  console.log('- SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
  console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('- APP_URL:', process.env.APP_URL);
  console.log('- REACT_APP_APP_URL:', process.env.REACT_APP_APP_URL);

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, customerEmail, userId, successUrl, cancelUrl, mode } = req.body;
    console.log('Request body:', { priceId, customerEmail, userId, successUrl, cancelUrl, mode });

    // Validate required fields
    if (!priceId || !customerEmail || !userId) {
      console.log('Missing required fields:', { priceId: !!priceId, customerEmail: !!customerEmail, userId: !!userId });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Looking up user profile for userId:', userId);
    
    // Get or create Stripe customer
    let customer;
    
    // First check if user already has a Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', userId)
      .single();

    console.log('Profile lookup result:', { profile, profileError });

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      throw new Error(`Profile lookup failed: ${profileError.message}`);
    }

    if (profile?.stripe_customer_id) {
      console.log('Using existing Stripe customer:', profile.stripe_customer_id);
      // Use existing customer
      customer = await stripe.customers.retrieve(profile.stripe_customer_id);
    } else {
      console.log('Creating new Stripe customer for email:', customerEmail);
      // Create new customer
      customer = await stripe.customers.create({
        email: customerEmail,
        name: profile?.full_name || customerEmail.split('@')[0],
        metadata: {
          supabase_user_id: userId
        }
      });

      console.log('Created new customer:', customer.id);

      // Update profile with Stripe customer ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error(`Profile update failed: ${updateError.message}`);
      }
    }

    console.log('Creating checkout session with priceId:', priceId);

    // Create checkout session
    const sessionParams = {
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode || 'subscription',
      success_url: successUrl || `${process.env.APP_URL || 'https://atomicpdf.org'}/editor?success=true`,
      cancel_url: cancelUrl || `${process.env.APP_URL || 'https://atomicpdf.org'}/editor?canceled=true`,
        metadata: {
        supabase_user_id: userId,
      },
      customer_update: {
        name: 'auto',
        address: 'auto',
      },
      tax_id_collection: {
        enabled: true,
      },
      automatic_tax: {
        enabled: false,
      },
    };

    if (mode === 'subscription') {
      sessionParams.subscription_data = {
        metadata: {
          supabase_user_id: userId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Checkout session created successfully:', session.id);
    console.log('=== CHECKOUT SESSION DEBUG END ===');

    res.status(200).json({ sessionId: session.id });

  } catch (error) {
    console.error('=== CHECKOUT SESSION ERROR ===');
    console.error('Error creating checkout session:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== END ERROR ===');
    
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
} 