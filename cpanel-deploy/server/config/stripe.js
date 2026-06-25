const Stripe = require('stripe');

// FAILSAFE: Use a placeholder key if the real one is missing
// This prevents the 503 Crashes!
const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_to_prevent_crash_123';

if (!process.env.STRIPE_SECRET_KEY) {
  console.log('⚠️ STRIPE_SECRET_KEY missing. Using placeholder to keep server running.');
}

const stripe = new Stripe(secretKey, {
  apiVersion: '2024-12-18.acacia',
});

module.exports = stripe;
