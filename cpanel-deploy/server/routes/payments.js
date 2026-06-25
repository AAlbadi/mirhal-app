const express = require('express');
const { verifyFirebaseToken } = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  refundPayment,
  getPaymentDetails,
} = require('../controllers/paymentController');
const { validatePaymentIntent, validateObjectId } = require('../middleware/validators');

const router = express.Router();

// Create payment intent (step 1: before booking)
router.post('/create-payment-intent', verifyFirebaseToken, validatePaymentIntent, createPaymentIntent);

// Confirm payment and create booking (step 2: after payment)
router.post('/confirm-payment', verifyFirebaseToken, confirmPayment);

// Refund a booking payment
router.post('/:bookingId/refund', verifyFirebaseToken, validateObjectId('bookingId'), refundPayment);

// Get payment details for a booking
router.get('/:bookingId/details', verifyFirebaseToken, validateObjectId('bookingId'), getPaymentDetails);

module.exports = router;
