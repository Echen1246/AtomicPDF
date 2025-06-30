# AtomicPDF Vercel Setup Guide

## 🎉 **You're Almost Done!**

Since you've already deployed to Vercel at **atomicpdf.org** and have your webhook secret, here's what you need to complete the setup.

## ✅ **Current Status**
- [x] Domain: **atomicpdf.org**
- [x] Webhook Secret: **whsec_uZ06oT1nJrtE8vCiwbDWHV2wW9L1F47d**
- [x] Stripe Price IDs configured
- [x] Vercel API routes created

## 🔧 **Step 1: Update Vercel Environment Variables**

In your Vercel dashboard → Settings → Environment Variables, add these **server-side** variables:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_uZ06oT1nJrtE8vCiwbDWHV2wW9L1F47d

# Supabase Configuration (Server-side)
SUPABASE_URL=https://nnsfkiljuhivxpqrqhul.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# App URL
REACT_APP_APP_URL=https://atomicpdf.org
```

## 🔄 **Step 2: Update Your Stripe Webhook URL**

In your Stripe Dashboard → Webhooks, update the endpoint URL to:
```
https://atomicpdf.org/api/stripe/webhook
```

## 🧪 **Step 3: Test Your Integration**

### Test the Complete Flow:

1. **Go to** https://atomicpdf.org
2. **Upload a PDF** and edit it 
3. **Try to export** → should prompt for Google login
4. **After login** → user profile should appear
5. **Click "Upgrade Plan"** → should show pricing
6. **Select a tier** → should redirect to Stripe checkout
7. **Use test card**: `4242 4242 4242 4242` with any future date
8. **Complete payment** → should return and update user tier

## 🔍 **Verification Steps**

### Check Vercel Function Logs:
1. Go to Vercel Dashboard → Functions
2. Look for `/api/stripe/webhook` logs
3. Verify webhook events are being received

### Check Stripe Webhook Delivery:
1. Stripe Dashboard → Webhooks → Your endpoint
2. View recent webhook attempts
3. Should see successful 200 responses

### Check Supabase Database:
1. Supabase Dashboard → Table Editor
2. Check `profiles` table for new users
3. Check `subscriptions` table for subscription records

## 🚨 **Common Issues & Solutions**

### 1. **Webhook 400 Error - Invalid Signature**
```bash
# Check these in Vercel environment variables:
STRIPE_WEBHOOK_SECRET=whsec_uZ06oT1nJrtE8vCiwbDWHV2wW9L1F47d
```

### 2. **Checkout Session Creation Fails**
```bash
# Verify these environment variables:
STRIPE_SECRET_KEY=sk_live_your_key
SUPABASE_URL=https://nnsfkiljuhivxpqrqhul.supabase.co  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. **Database Not Updating After Payment**
- Check Vercel function logs for errors
- Verify Supabase service role key has proper permissions
- Check that webhook events include the expected ones

### 4. **CORS Errors**
The API routes should work correctly, but if you see CORS errors:
- Check that your domain is correctly set in environment variables
- Verify the API routes are deployed correctly

## 📊 **Environment Variables Checklist**

### Frontend (already configured):
- [x] `REACT_APP_SUPABASE_URL`
- [x] `REACT_APP_SUPABASE_ANON_KEY` 
- [x] `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- [x] `REACT_APP_APP_URL=https://atomicpdf.org`

### Backend (add to Vercel):
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_uZ06oT1nJrtE8vCiwbDWHV2wW9L1F47d`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

## 🎯 **API Endpoints Created**

Your Vercel deployment now has these API routes:

1. **`/api/stripe/webhook`** - Handles Stripe webhook events
2. **`/api/create-checkout-session`** - Creates subscription checkout sessions  
3. **`/api/create-portal-session`** - Creates customer billing portal sessions

## 📈 **What Happens When Users Subscribe**

1. **User clicks "Upgrade"** → `/api/create-checkout-session` creates Stripe session
2. **User pays** → Stripe sends webhook to `/api/stripe/webhook`
3. **Webhook processes** → Updates Supabase `profiles` and `subscriptions` tables
4. **User returns** → Frontend shows updated subscription tier

## 🔐 **Security Features**

✅ **Webhook signature verification** - Ensures requests are from Stripe  
✅ **Service role authentication** - Secure database updates  
✅ **Row Level Security** - Users can only access their own data  
✅ **PCI compliance** - Payment processing handled by Stripe  

## 🚀 **Production Checklist**

Before going fully live:

- [ ] Switch to Stripe **live mode** keys (remove `_test_` from keys)
- [ ] Test with real payment amounts 
- [ ] Set up error monitoring (Sentry/LogRocket)
- [ ] Configure email notifications for failed payments
- [ ] Add analytics tracking
- [ ] Test subscription cancellation/upgrades

## 🎉 **You're Ready!**

Once the environment variables are set in Vercel, your AtomicPDF application will have:

✅ **Professional PDF editing**  
✅ **Google OAuth authentication**  
✅ **Stripe subscription management**  
✅ **Real-time usage tracking**  
✅ **Automated webhook processing**  
✅ **Scalable serverless architecture**  

Your users can now seamlessly upgrade and manage their subscriptions! 