import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, returnUrl } = req.body;

    // Validate required fields
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.REACT_APP_APP_URL || 'https://atomicpdf.org'}/editor`,
    });

    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Error creating portal session:', error);
    
    res.status(500).json({ 
      error: 'Failed to create portal session',
      details: error.message 
    });
  }
} 