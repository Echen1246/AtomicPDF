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
    price: 0.99,
    priceId: 'price_1RiQG6DG3wjiUUIB5rrU7y1O',
    features: [
      '50 Downloads per month',
      'Text annotations & highlights',
      'Drawing tools',
      'Page operations',
    ],
    mode: 'subscription',
    popular: false,
  },
  standard: {
    name: 'Standard',
    price: 2.99,
    priceId: 'price_1RiQGgDG3wjiUUIBoHmt1n4v',
    features: [
      '200 Downloads per month',
      'All Basic features',
      'Bulk operations',
      'Priority support',
    ],
    mode: 'subscription',
    popular: true,
  },
  professional: {
    name: 'Professional',
    price: 4.99,
    priceId: 'price_1RiQH5DG3wjiUUIBm99OIXVG',
    features: [
      '1000 Downloads per month',
      'All Standard features',
      'Advanced export options',
      'Premium support',
    ],
    mode: 'subscription',
    popular: false,
  },
  unlimited: {
    name: 'Unlimited',
    price: 9.99,
    priceId: 'price_1RiQHZDG3wjiUUIBKatTQ3mV',
    features: [
      'Unlimited Downloads',
      'All Professional features',
      'One-time payment',
      'Lifetime access',
    ],
    mode: 'payment',
    popular: false,
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