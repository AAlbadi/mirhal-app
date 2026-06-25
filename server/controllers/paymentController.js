const stripe = require('../config/stripe');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { getUserByFirebaseUid } = require('../middleware/user-sync');
const {
  sendBookingConfirmationEmail,
  sendAdminBookingNotification
} = require('../utils/emailService');

/**
 * Create a payment intent for a booking
 * This is called before the booking is created to get payment authorization
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate, numberOfGuests } = req.body;
    const userId = req.user.supabaseUid;

    // Validate required fields
    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get vehicle details
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Convert to plain object to avoid Mongoose getter issues
    const vehicleObj = vehicle.toObject();

    console.log('📋 Vehicle found:', {
      id: vehicleObj._id,
      title: vehicleObj.title,
      pricePerDay: vehicleObj.pricePerDay,
      allFields: Object.keys(vehicleObj)
    });

    // Check availability
    const isAvailable = await Booking.checkAvailability(vehicleId, startDate, endDate);
    if (!isAvailable) {
      return res.status(400).json({ error: 'Vehicle is not available for the selected dates' });
    }

    // Calculate pricing - check for both pricePerDay and price fields
    const pricePerDay = vehicleObj.pricePerDay || vehicleObj.price || vehicle.pricePerDay || vehicle.price;
    if (!pricePerDay) {
      console.error('❌ Vehicle has no price field:', vehicleObj);
      return res.status(400).json({ error: 'Vehicle price is not set' });
    }

    console.log('✅ Using price:', pricePerDay);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = pricePerDay * nights;
    const serviceFee = totalPrice * 0.10; // 10% service fee
    const finalTotal = totalPrice + serviceFee;

    // Create payment intent (amount in cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalTotal * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
        vehicleId: vehicleId.toString(),
        startDate: startDate.toString(),
        endDate: endDate.toString(),
        numberOfGuests: numberOfGuests ? numberOfGuests.toString() : '1',
        nights: nights.toString(),
        pricePerDay: pricePerDay.toString(),
        totalPrice: totalPrice.toString(),
        serviceFee: serviceFee.toString(),
        finalTotal: finalTotal.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: finalTotal,
      breakdown: {
        pricePerDay: pricePerDay,
        nights,
        totalPrice,
        serviceFee,
        finalTotal,
      },
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

/**
 * Confirm payment and create booking
 * This is called after the payment is successfully processed
 */
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const supabaseUid = req.user.supabaseUid;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Get or create MongoDB User for the renter
    const renterUser = await getUserByFirebaseUid(supabaseUid, {
      email: req.user.email,
      name: req.user.name || req.body.guestName,
      picture: req.user.picture,
      email_verified: req.user.email_verified,
    });

    console.log('👤 Renter User:', {
      supabaseUid,
      mongoUserId: renterUser._id,
      name: renterUser.name
    });

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verify payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment not completed',
        status: paymentIntent.status
      });
    }

    // Check if booking already exists for this payment
    const existingBooking = await Booking.findOne({ paymentIntentId });
    if (existingBooking) {
      return res.json({ booking: existingBooking });
    }

    // Extract metadata
    const metadata = paymentIntent.metadata;

    // Get vehicle and verify it still exists
    const vehicle = await Vehicle.findById(metadata.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    console.log('🚐 Vehicle found:', {
      id: vehicle._id,
      hostId: vehicle.hostId,
      title: vehicle.title
    });

    // Double-check availability
    const isAvailable = await Booking.checkAvailability(
      metadata.vehicleId,
      metadata.startDate,
      metadata.endDate
    );
    if (!isAvailable) {
      // Payment succeeded but dates are no longer available
      // TODO: Implement automatic refund here
      return res.status(400).json({
        error: 'Vehicle is no longer available for selected dates. Please contact support for a refund.',
        refundNeeded: true
      });
    }

    // Create the booking with all data from the payment intent
    const booking = new Booking({
      vehicleId: metadata.vehicleId,
      renterId: renterUser._id, // Use MongoDB ObjectId
      hostId: vehicle.hostId, // Use vehicle's hostId (MongoDB ObjectId)
      startDate: new Date(metadata.startDate),
      endDate: new Date(metadata.endDate),
      numberOfDays: parseInt(metadata.nights),
      guestDetails: {
        name: req.body.guestName || '',
        email: req.body.guestEmail || '',
        phone: req.body.guestPhone || '',
        numberOfGuests: parseInt(metadata.numberOfGuests) || 1,
      },
      specialRequests: req.body.specialRequests || '',
      pricePerDay: parseFloat(metadata.pricePerDay),
      totalPrice: parseFloat(metadata.totalPrice),
      serviceFee: parseFloat(metadata.serviceFee),
      finalTotal: parseFloat(metadata.finalTotal),
      paymentIntentId: paymentIntentId,
      paymentStatus: 'paid',
      status: 'pending', // Still requires host approval
    });

    console.log('💾 Creating booking:', {
      vehicleId: booking.vehicleId,
      renterId: booking.renterId,
      hostId: booking.hostId,
      numberOfDays: booking.numberOfDays,
      guestDetails: booking.guestDetails
    });

    await booking.save();

    console.log('✅ Booking created successfully:', booking._id);

    // Populate vehicle and host details for response
    await booking.populate('vehicleId');
    await booking.populate('hostId', 'name email');
    await booking.populate('renterId', 'name email');

    // Send email notifications
    try {
      // 1. Send confirmation to guest (payment received)
      await sendBookingConfirmationEmail(
        booking,
        booking.renterId,
        booking.vehicleId,
        booking.hostId
      );

      // 2. Send notification to ADMIN for approval (not host yet)
      await sendAdminBookingNotification(
        booking,
        booking.renterId,
        booking.vehicleId,
        booking.hostId
      );

      console.log('📧 Booking emails sent: Guest confirmed + Admin notified');
    } catch (emailError) {
      console.error('Error sending booking emails:', emailError);
      // Don't fail the booking if emails fail
    }

    res.status(201).json({ booking });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment and create booking' });
  }
};

/**
 * Handle refunds for cancelled bookings
 */
const refundPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.supabaseUid;

    // Get the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify user is the renter or host
    if (booking.renter !== userId && booking.host.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to refund this booking' });
    }

    // Check if booking is already refunded
    if (booking.paymentStatus === 'refunded') {
      return res.status(400).json({ error: 'Booking already refunded' });
    }

    // Check if payment was made
    if (!booking.paymentIntentId || booking.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'No payment to refund' });
    }

    // Calculate refund amount based on cancellation policy
    // For now, full refund (you can add time-based policies later)
    const refundAmount = Math.round(booking.finalTotal * 100); // in cents

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: booking.paymentIntentId,
      amount: refundAmount,
      reason: 'requested_by_customer',
    });

    // Update booking status
    booking.paymentStatus = 'refunded';
    booking.status = 'cancelled';
    await booking.save();

    res.json({
      message: 'Refund processed successfully',
      refund,
      booking
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
};

/**
 * Get payment details for a booking
 */
const getPaymentDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.supabaseUid;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify user is the renter or host
    if (booking.renter !== userId && booking.host.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    if (!booking.paymentIntentId) {
      return res.status(404).json({ error: 'No payment information available' });
    }

    // Get payment intent details from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);

    res.json({
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      created: new Date(paymentIntent.created * 1000),
      paymentMethod: paymentIntent.payment_method,
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  refundPayment,
  getPaymentDetails,
};
