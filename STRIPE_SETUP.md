# Stripe Product Setup Guide

## 1. Create Products in Stripe Dashboard

Go to your Stripe Dashboard → Products → Add Product

### Basic Plan
- **Name**: AtomicPDF Basic
- **Description**: 25 PDFs per month with essential editing tools
- **Pricing**: $2.99/month
- **Billing**: Recurring monthly
- **Copy the Price ID** (starts with `price_`) - you'll need this

### Standard Plan  
- **Name**: AtomicPDF Standard
- **Description**: 100 PDFs per month with advanced features
- **Pricing**: $4.99/month
- **Billing**: Recurring monthly
- **Copy the Price ID** (starts with `price_`) - you'll need this

### Professional Plan
- **Name**: AtomicPDF Professional  
- **Description**: Unlimited PDFs with premium features
- **Pricing**: $9.99/month
- **Billing**: Recurring monthly
- **Copy the Price ID** (starts with `price_`) - you'll need this

## 2. Configure Webhooks

Go to Stripe Dashboard → Webhooks → Add endpoint

**Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
**Events to send**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Copy the Webhook Signing Secret** - you'll need this for verification

## 3. Update Environment Variables

Add these to your `.env` file:
```
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (replace with your actual IDs)
STRIPE_BASIC_PRICE_ID=price_1234567890abcdef
STRIPE_STANDARD_PRICE_ID=price_1234567890abcdef  
STRIPE_PROFESSIONAL_PRICE_ID=price_1234567890abcdef
```

## 4. Test Mode vs Live Mode

**For Development**: Use test mode keys (start with `pk_test_` and `sk_test_`)
**For Production**: Use live mode keys (start with `pk_live_` and `sk_live_`)

## 5. Next Steps

After creating the products, update the price IDs in `src/lib/stripe.ts` and implement the backend API endpoints. 