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
  pro: {
    name: 'Pro',
    price: 0.99,
    priceId: 'price_1Ro8WVDG3wjiUUIBrGhDzcWh',
    features: [
      'Unlimited Downloads',
      'All editing features',
      'One-time payment',
      'Lifetime access',
    ],
    mode: 'payment',
    popular: true,
  },
} as const;

export type PricingTier = keyof typeof PRICING_PLANS;

// Helper function to create checkout session
export const createCheckoutSession = async (
  priceId: string,
  customerEmail: string,
  userId: string,
  mode: 'subscription' | 'payment'
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
        mode,
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