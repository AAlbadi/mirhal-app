const express = require('express');
const { verifyFirebaseToken } = require('../middleware/auth');
const { getUserByFirebaseUid } = require('../middleware/user-sync');
const Booking = require('../models/Booking');
const stripe = require('../config/stripe');
const { validateObjectId, validateCancellation } = require('../middleware/validators');
const { sendCancellationEmail } = require('../utils/emailService');

const router = express.Router();

// Get renter's own bookings
router.get('/my-bookings', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await getUserByFirebaseUid(req.user.uid);

    const bookings = await Booking.find({ renterId: user._id })
      .populate('vehicleId', 'title type images location price')
      .populate('hostId', 'name email picture')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching renter bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get specific booking details
router.get('/bookings/:id', verifyFirebaseToken, validateObjectId('id'), async (req, res) => {
  try {
    const user = await getUserByFirebaseUid(req.user.uid);

    const booking = await Booking.findOne({
      _id: req.params.id,
      renterId: user._id
    })
      .populate('vehicleId')
      .populate('hostId', 'name email picture phone');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
});

// Cancel a booking
router.post('/bookings/:id/cancel', verifyFirebaseToken, validateObjectId('id'), validateCancellation, async (req, res) => {
  try {
    const user = await getUserByFirebaseUid(req.user.uid);
    const { reason } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      renterId: user._id
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    booking.cancelledBy = 'renter';
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();

    await booking.save();

    // Initiate refund process if payment was made
    let refundInfo = null;
    if (booking.paymentIntentId && booking.paymentStatus === 'paid') {
      try {
        const refundAmount = Math.round(booking.finalTotal * 100); // in cents
        const refund = await stripe.refunds.create({
          payment_intent: booking.paymentIntentId,
          amount: refundAmount,
          reason: 'requested_by_customer',
        });

        booking.paymentStatus = 'refunded';
        await booking.save();

        refundInfo = {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status
        };

        console.log(`💰 Refund processed for booking: ${booking._id}, amount: $${refund.amount / 100}`);
      } catch (refundError) {
        console.error('Error processing refund:', refundError);
        // Don't fail the cancellation if refund fails - log for manual processing
        console.error(`⚠️ Manual refund needed for booking ${booking._id}`);
      }
    }

    console.log(`📛 Booking cancelled by renter: ${booking._id}`);

    // Send cancellation confirmation email
    try {
      await booking.populate('vehicleId');
      await booking.populate('renterId');

      await sendCancellationEmail(
        booking,
        booking.renterId,
        booking.vehicleId
      );
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
      // Don't fail the cancellation if email fails
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking,
      refund: refundInfo
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

module.exports = router;
