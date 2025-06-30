# AtomicPDF Deployment Guide

## 🚀 **Complete Setup Walkthrough**

This guide will walk you through deploying AtomicPDF with full Stripe integration using Netlify.

## 📋 **Prerequisites**

- [x] Google OAuth configured in Supabase
- [x] Stripe products created with price IDs
- [x] Supabase database tables created
- [ ] Netlify account
- [ ] Domain name (optional)

## 🔧 **Step 1: Stripe Dashboard Configuration**

### Configure Webhook Endpoint

1. **Go to Stripe Dashboard** → Webhooks → "Add endpoint"

2. **Endpoint URL**: 
   ```
   https://your-site-name.netlify.app/.netlify/functions/stripe-webhook
   ```

3. **Select Events**:
   ```
   customer.subscription.created
   customer.subscription.updated  
   customer.subscription.deleted
   invoice.payment_succeeded
   invoice.payment_failed
   customer.created
   customer.updated
   ```

4. **Save and copy the Webhook Signing Secret** (starts with `whsec_`)

## 🌐 **Step 2: Deploy to Netlify**

### Option A: Deploy via Git (Recommended)

1. **Push your code to GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Add Stripe integration and Netlify functions"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your repository
   - Set build command: `npm run build`
   - Set publish directory: `build`

### Option B: Manual Deploy

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Drag and drop the `build` folder to Netlify
   - Your functions will be deployed automatically

## 🔐 **Step 3: Environment Variables**

In your Netlify dashboard → Site settings → Environment variables, add:

```bash
# React App Variables
REACT_APP_SUPABASE_URL=https://nnsfkiljuhivxpqrqhul.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
REACT_APP_APP_URL=https://your-site-name.netlify.app

# Server-side Variables (for functions)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SUPABASE_URL=https://nnsfkiljuhivxpqrqhul.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Price IDs
STRIPE_BASIC_PRICE_ID=price_1RfWLyDG3wjiUUIB8eqsutL2
STRIPE_STANDARD_PRICE_ID=price_1RfWMrDG3wjiUUIBoqAYwRUb
STRIPE_PROFESSIONAL_PRICE_ID=price_1RfWShDG3wjiUUIBppj9ct4X
```

## 🔄 **Step 4: Update Webhook URL in Stripe**

After deployment, update your Stripe webhook endpoint URL to:
```
https://your-actual-site.netlify.app/.netlify/functions/stripe-webhook
```

## 🧪 **Step 5: Test the Integration**

### Test Checklist:

1. **Basic Functionality**:
   - [ ] Upload and edit PDFs
   - [ ] Annotation tools work
   - [ ] Export requires authentication

2. **Authentication**:
   - [ ] Google OAuth login works
   - [ ] User profile appears after login
   - [ ] Usage tracking displays correctly

3. **Subscriptions**:
   - [ ] Pricing page loads correctly
   - [ ] Checkout redirects to Stripe
   - [ ] Successful payment updates user tier
   - [ ] Billing portal works for existing subscribers

4. **Webhooks**:
   - [ ] Webhook endpoint responds (check Netlify function logs)
   - [ ] Subscription changes sync to Supabase
   - [ ] User tier updates after payment

## 📊 **Step 6: Monitoring & Analytics**

### Netlify Function Logs
Monitor your functions at:
```
https://app.netlify.com/sites/your-site/functions
```

### Stripe Webhook Monitoring
Check webhook delivery in Stripe Dashboard → Webhooks → View logs

### Supabase Database
Monitor user activity in Supabase Dashboard → Table Editor

## 🛠️ **Troubleshooting**

### Common Issues:

**1. Webhook 400 Error - Invalid Signature**
- Check webhook secret in environment variables
- Ensure raw body is passed to verification

**2. Function Timeout**
- Optimize database queries
- Add error handling for slow operations

**3. CORS Errors**
- Check Access-Control headers in function responses
- Verify domain in environment variables

**4. Checkout Not Working**
- Verify Stripe publishable key
- Check price IDs match your Stripe products
- Ensure customer creation works

**5. Database Not Updating**
- Check Supabase service role key
- Verify RLS policies allow service role access
- Check function logs for database errors

## 📱 **Step 7: Custom Domain (Optional)**

1. **In Netlify**:
   - Go to Site settings → Domain management
   - Add custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**:
   ```bash
   REACT_APP_APP_URL=https://your-domain.com
   ```

3. **Update Stripe Webhook URL**:
   ```
   https://your-domain.com/.netlify/functions/stripe-webhook
   ```

4. **Update Google OAuth Redirect**:
   - Add your domain to Google OAuth authorized origins
   - Update Supabase redirect URLs

## 🎯 **Production Checklist**

Before going live:

- [ ] Switch to Stripe live mode keys
- [ ] Update Google OAuth to production credentials
- [ ] Configure real domain name
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Test with real payments
- [ ] Set up backup/monitoring for Supabase
- [ ] Configure email notifications for failed payments
- [ ] Add terms of service and privacy policy
- [ ] Set up analytics (Google Analytics, Mixpanel)

## 📈 **Post-Launch Optimization**

1. **Performance**:
   - Enable Netlify CDN
   - Optimize images and assets
   - Add service worker for offline support

2. **SEO**:
   - Add meta tags for social sharing
   - Submit sitemap to Google
   - Configure robots.txt

3. **Analytics**:
   - Track conversion funnel
   - Monitor subscription metrics
   - A/B test pricing strategy

## 🆘 **Support Resources**

- **Netlify Docs**: https://docs.netlify.com/
- **Stripe Integration**: https://stripe.com/docs/webhooks
- **Supabase Docs**: https://supabase.com/docs
- **React Deployment**: https://create-react-app.dev/docs/deployment/

## 🎉 **You're Live!**

Once deployed, your AtomicPDF application will have:
- ✅ Professional PDF editing capabilities
- ✅ Secure Google OAuth authentication  
- ✅ Stripe subscription management
- ✅ Real-time usage tracking
- ✅ Automated billing and webhooks
- ✅ Scalable serverless architecture

Your users can now seamlessly edit PDFs and upgrade to paid plans as needed! 