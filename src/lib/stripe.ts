import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export default getStripe;

// Pricing configuration
export const PRICING_PLANS = {
  basic: {
    name: 'Basic',
    price: 2.99,
    priceId: 'price_1RfWLyDG3wjiUUIB8eqsutL2', // Replace with your actual Stripe price ID
    features: [
      '25 PDFs per month',
      'Text annotations & highlights',
      'Drawing tools',
      'Page operations',
      'Standard support'
    ],
    popular: false
  },
  standard: {
    name: 'Standard',
    price: 4.99,
    priceId: 'price_1RfWMrDG3wjiUUIBoqAYwRUb', // Replace with your actual Stripe price ID
    features: [
      '100 PDFs per month',
      'All Basic features',
      'Bulk operations',
      'Export to multiple formats',
      'Priority support'
    ],
    popular: true
  },
  professional: {
    name: 'Professional',
    price: 9.99,
    priceId: 'price_1RfWShDG3wjiUUIBppj9ct4X', // Replace with your actual Stripe price ID
    features: [
      'Unlimited PDFs',
      'All Standard features',
      'Advanced export options',
      'API access',
      'Premium support'
    ],
    popular: false
  }
} as const;

export type PricingTier = keyof typeof PRICING_PLANS;

// Helper function to create checkout session
export const createCheckoutSession = async (
  priceId: string,
  customerEmail: string,
  userId: string
) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        customerEmail,
        userId,
        successUrl: `${window.location.origin}/editor?success=true`,
        cancelUrl: `${window.location.origin}/editor?canceled=true`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Helper function to create customer portal session
export const createPortalSession = async (customerId: string) => {
  try {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: `${window.location.origin}/editor`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create portal session');
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}; 