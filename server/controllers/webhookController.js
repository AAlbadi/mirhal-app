const stripe = require('../config/stripe');
const Booking = require('../models/Booking');
const emailService = require('../services/emailService');

/**
 * Handle Stripe webhook events
 * This receives real-time updates from Stripe about payment status changes
 */
const handleWebhook = async (req, res) => {
  console.log('📥 Stripe webhook received');
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⚠️  WARNING: STRIPE_WEBHOOK_SECRET is not set');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).send('Webhook handler failed');
  }
};

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('✅ Payment succeeded:', paymentIntent.id);

  // Find booking by payment intent ID
  const booking = await Booking.findOne({ paymentIntentId: paymentIntent.id })
    .populate('vehicle')
    .populate('renter', 'name email')
    .populate('host', 'name email');

  if (booking) {
    // Update payment status
    booking.paymentStatus = 'paid';
    await booking.save();

    console.log('✅ Booking payment status updated:', booking._id);

    // Send confirmation emails
    try {
      await emailService.sendBookingConfirmationToRenter(booking);
      await emailService.sendNewBookingNotificationToHost(booking);
    } catch (emailError) {
      console.error('Error sending confirmation emails:', emailError);
    }
  } else {
    console.log('ℹ️  No booking found for payment intent:', paymentIntent.id);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);

  const booking = await Booking.findOne({ paymentIntentId: paymentIntent.id });

  if (booking) {
    booking.paymentStatus = 'failed';
    await booking.save();
    console.log('❌ Booking payment status updated to failed:', booking._id);
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(paymentIntent) {
  console.log('🚫 Payment canceled:', paymentIntent.id);

  const booking = await Booking.findOne({ paymentIntentId: paymentIntent.id });

  if (booking) {
    booking.paymentStatus = 'failed';
    booking.status = 'cancelled';
    await booking.save();
    console.log('🚫 Booking canceled:', booking._id);
  }
}

/**
 * Handle refunded charge
 */
async function handleChargeRefunded(charge) {
  console.log('💰 Charge refunded:', charge.id);

  // Find booking by payment intent
  const booking = await Booking.findOne({ paymentIntentId: charge.payment_intent })
    .populate('renter', 'name email');

  if (booking) {
    booking.paymentStatus = 'refunded';
    await booking.save();
    console.log('💰 Booking refund status updated:', booking._id);

    // Send refund confirmation email
    try {
      await emailService.sendRefundConfirmation(booking);
    } catch (emailError) {
      console.error('Error sending refund confirmation:', emailError);
    }
  }
}

module.exports = {
  handleWebhook,
};
