# Stripe Payment Integration Setup Guide

This guide will help you configure Stripe payment processing for your Mirhal RV & Camper Marketplace booking system.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Node.js and npm installed
3. MongoDB running locally or remotely

## Step 1: Get Your Stripe API Keys

1. Log in to your Stripe Dashboard at https://dashboard.stripe.com
2. Navigate to **Developers > API keys**
3. You'll need two keys:
   - **Publishable key** (starts with `pk_test_` for test mode)
   - **Secret key** (starts with `sk_test_` for test mode)

⚠️ **Important:** Use test keys during development. Only use live keys in production.

## Step 2: Configure Environment Variables

### Backend Configuration

Create or update `/server/.env` file:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/mirhal

# Auth0
AUTH0_AUDIENCE=your-auth0-audience
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Mirhal <noreply@mirhal.com>

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend Configuration

Create or update `/.env` file:

```bash
# API URL
VITE_API_URL=http://localhost:5000/api

# Stripe Publishable Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Auth0 Configuration
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-audience
```

## Step 3: Set Up Stripe Webhooks

Webhooks allow Stripe to notify your server about payment events in real-time.

### For Development (Using Stripe CLI)

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (with Scoop)
   scoop install stripe

   # Linux
   # Download from: https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhook events to your local server:**
   ```bash
   stripe listen --forward-to http://localhost:5000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** from the output (starts with `whsec_`) and add it to your `/server/.env` file as `STRIPE_WEBHOOK_SECRET`.

### For Production

1. Go to **Stripe Dashboard > Developers > Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/webhooks/stripe`
4. Select the following events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
5. Copy the **Signing secret** and add it to your production environment variables

## Step 4: Test the Payment Flow

### Using Stripe Test Cards

Stripe provides test card numbers for different scenarios:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
| `4000 0000 0000 9995` | Payment declined |
| `4000 0000 0000 0341` | Attaching fails |

**For all test cards:**
- Use any future expiration date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)
- Use any ZIP code (e.g., 12345)

### Test the Complete Flow

1. **Start your servers:**
   ```bash
   # Terminal 1: Start backend
   cd server
   npm run dev

   # Terminal 2: Start frontend
   cd ..
   npm run dev

   # Terminal 3: Start Stripe webhook listener (development only)
   stripe listen --forward-to http://localhost:5000/api/webhooks/stripe
   ```

2. **Make a test booking:**
   - Navigate to a vehicle detail page
   - Click "Reserve Now"
   - Select dates
   - Fill in guest details
   - Use test card `4242 4242 4242 4242` for payment
   - Complete the booking

3. **Verify the booking:**
   - Check the MongoDB database for the new booking
   - Check Stripe Dashboard for the payment
   - Check console for email notifications
   - Check host dashboard for the booking request

## Step 5: Payment Flow Overview

Here's how the payment system works:

```
1. Guest selects dates and fills in details
   ↓
2. Frontend calls POST /api/payments/create-payment-intent
   ↓
3. Backend creates Stripe PaymentIntent (amount is authorized but not captured)
   ↓
4. Frontend displays Stripe payment form
   ↓
5. Guest enters card details
   ↓
6. Stripe processes payment (funds are held, not yet charged)
   ↓
7. Frontend calls POST /api/payments/confirm-payment
   ↓
8. Backend creates booking in database with status "pending"
   ↓
9. Stripe webhook confirms payment success
   ↓
10. Backend updates booking status to "paid"
    ↓
11. Email notifications sent to guest and host
    ↓
12. Host approves or declines booking
    ↓
13. If approved: booking becomes active
    If declined: refund can be processed
```

## Step 6: Refund Handling

### Automatic Refunds (via code)

Refunds can be triggered through the API:

```bash
POST /api/payments/:bookingId/refund
Authorization: Bearer {token}
```

### Manual Refunds (via Stripe Dashboard)

1. Go to **Stripe Dashboard > Payments**
2. Find the payment
3. Click "Refund"
4. Enter the refund amount
5. The webhook will automatically update the booking status

## Troubleshooting

### Webhook not receiving events

- Check that Stripe CLI is running (`stripe listen`)
- Verify the webhook secret in `.env` matches the CLI output
- Check server logs for webhook errors
- Ensure the webhook route is accessible

### Payment fails with "No such payment intent"

- Verify `VITE_STRIPE_PUBLISHABLE_KEY` in frontend `.env`
- Check that frontend and backend are communicating
- Verify Auth0 token is being sent correctly

### "Stripe is not defined" error

- Ensure `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Restart the frontend development server
- Clear browser cache

### Booking created but payment status is "pending"

- Check that webhook is configured and receiving events
- Verify webhook secret is correct
- Check server logs for webhook processing errors

## Security Best Practices

1. **Never commit API keys to version control**
   - Add `.env` files to `.gitignore`
   - Use environment variables in production

2. **Use webhook signing secrets**
   - Always verify webhook signatures
   - This prevents fake webhook events

3. **Validate amounts on the backend**
   - Never trust amounts sent from the frontend
   - Always recalculate prices on the server

4. **Use HTTPS in production**
   - Webhooks require HTTPS endpoints
   - Stripe rejects insecure connections

5. **Handle errors gracefully**
   - Show user-friendly error messages
   - Log detailed errors for debugging

## Going to Production

When you're ready to accept real payments:

1. **Activate your Stripe account** (complete business verification)
2. **Switch to live API keys** in your environment variables
3. **Set up production webhooks** (see Step 3)
4. **Update frontend environment** with live publishable key
5. **Test with real card** (use a small amount first)
6. **Monitor Stripe Dashboard** for real transactions

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

## Support

If you encounter any issues:

1. Check the [Stripe Dashboard logs](https://dashboard.stripe.com/logs)
2. Review your server logs for errors
3. Test with Stripe CLI webhook forwarding
4. Contact Stripe Support for payment-specific issues

---

**Note:** This integration is configured for immediate payment authorization. The payment is held when the booking is created and requires host approval. For alternative flows (pay later, deposits, etc.), the payment controller logic will need to be modified.
