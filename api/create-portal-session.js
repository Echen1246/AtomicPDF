import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, returnUrl } = req.body;

    console.log('Portal session request:', { customerId, returnUrl });
    console.log('Stripe secret key exists:', !!process.env.STRIPE_SECRET_KEY);

    // Validate required fields
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.APP_URL || 'https://atomicpdf.org'}/editor`,
    });

    console.log('Portal session created:', session.id);
    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Error creating portal session:', error);
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);
    
    // Check if it's a Stripe configuration error
    if (error.type === 'StripeInvalidRequestError' && error.message.includes('billing portal')) {
      res.status(500).json({ 
        error: 'Billing portal not configured',
        details: 'Please configure the customer portal in your Stripe dashboard: https://dashboard.stripe.com/settings/billing/portal',
        helpUrl: 'https://dashboard.stripe.com/settings/billing/portal'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to create portal session',
        details: error.message 
      });
    }
  }
} 