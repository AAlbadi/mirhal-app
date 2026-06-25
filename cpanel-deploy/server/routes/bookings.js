const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { checkJwt, attachUser } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { sendNewBookingEmails, sendBookingApprovedEmail, sendBookingDeclinedEmail, sendBookingApprovedEmailToHost } = require('../services/emailService');
const { sendBookingApprovedToGuest, sendNewBookingToHost, sendWhatsAppMessage } = require('../utils/whatsappService');

// Get vehicle availability for specific dates
router.get('/availability/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const isAvailable = await Booking.checkAvailability(
      vehicleId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({ available: isAvailable });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Get booked dates for a vehicle (for calendar display)
router.get('/booked-dates/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const bookings = await Booking.find({
      vehicleId,
      status: { $in: ['pending', 'approved'] },
    }).select('startDate endDate status');

    const bookedDates = bookings.map(booking => ({
      start: booking.startDate,
      end: booking.endDate,
      status: booking.status,
    }));

    res.json({ bookedDates });
  } catch (error) {
    console.error('Get booked dates error:', error);
    res.status(500).json({ error: 'Failed to get booked dates' });
  }
});

// Create a new booking
router.post(
  '/',
  checkJwt,
  attachUser,
  [
    body('vehicleId').isMongoId().withMessage('Valid vehicle ID required'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required'),
    body('guestDetails.name').trim().notEmpty().withMessage('Guest name required'),
    body('guestDetails.email').isEmail().withMessage('Valid email required'),
    body('guestDetails.numberOfGuests').isInt({ min: 1 }).withMessage('Number of guests required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vehicleId, startDate, endDate, guestDetails, specialRequests } = req.body;

      // Get vehicle details
      const vehicle = await Vehicle.findById(vehicleId).populate('hostId');
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      if (!vehicle.isActive) {
        return res.status(400).json({ error: 'Vehicle is not available for booking' });
      }

      // Check if user is trying to book their own vehicle
      if (vehicle.hostId._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ error: 'You cannot book your own vehicle' });
      }

      // Check availability
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }

      if (start < new Date()) {
        return res.status(400).json({ error: 'Start date cannot be in the past' });
      }

      const isAvailable = await Booking.checkAvailability(vehicleId, start, end);
      if (!isAvailable) {
        return res.status(400).json({ error: 'Vehicle is not available for selected dates' });
      }

      // Calculate pricing
      const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const pricePerDay = vehicle.price;
      const totalPrice = numberOfDays * pricePerDay;
      const serviceFee = totalPrice * 0.10; // 10% service fee
      const finalTotal = totalPrice + serviceFee;

      // Create booking
      const booking = new Booking({
        vehicleId,
        renterId: req.user._id,
        hostId: vehicle.hostId._id,
        startDate: start,
        endDate: end,
        numberOfDays,
        pricePerDay,
        totalPrice,
        serviceFee,
        finalTotal,
        guestDetails,
        specialRequests,
        status: 'pending',
        paymentStatus: 'pending',
      });

      await booking.save();

      // Populate the booking with vehicle and user details
      await booking.populate(['vehicleId', 'renterId', 'hostId']);

      // Send email notifications to both host and renter
      try {
        await sendNewBookingEmails(booking, vehicle);
      } catch (emailError) {
        console.error('Failed to send booking emails:', emailError);
        // Continue even if email fails - don't break the booking creation
      }

      // Send WhatsApp notifications
      try {
        // WhatsApp to admin
        const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
        if (adminPhone) {
          const checkIn = new Date(booking.startDate).toLocaleDateString();
          const checkOut = new Date(booking.endDate).toLocaleDateString();
          const adminMessage = `🔔 *New Booking Request / طلب حجز جديد*\n\n` +
            `*English:*\n` +
            `Vehicle: ${vehicle.title}\n` +
            `Guest: ${booking.guestDetails.name}\n` +
            `Check-in: ${checkIn}\n` +
            `Check-out: ${checkOut}\n` +
            `Total: AED ${booking.finalTotal}\n\n` +
            `*عربي:*\n` +
            `المركبة: ${vehicle.title}\n` +
            `الضيف: ${booking.guestDetails.name}\n` +
            `الدخول: ${checkIn}\n` +
            `الخروج: ${checkOut}\n` +
            `الإجمالي: ${booking.finalTotal} درهم\n\n` +
            `Review at / راجع: ${process.env.FRONTEND_URL}/admin/dashboard`;

          await sendWhatsAppMessage(adminPhone, adminMessage);
        }

        // WhatsApp to host
        await sendNewBookingToHost(booking, booking.hostId, vehicle);
      } catch (whatsappError) {
        console.error('Failed to send WhatsApp notifications:', whatsappError);
      }

      res.status(201).json({
        message: 'Booking created successfully',
        booking,
      });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
);

// Get user's bookings (as renter)
router.get('/my-bookings', checkJwt, attachUser, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { renterId: req.user._id };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('vehicleId')
      .populate('hostId', 'name email picture')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get bookings for host's vehicles
router.get('/host-bookings', checkJwt, attachUser, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { hostId: req.user._id };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('vehicleId')
      .populate('renterId', 'name email picture')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Get host bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get single booking details
router.get('/:id', checkJwt, attachUser, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('vehicleId')
      .populate('renterId', 'name email picture phone')
      .populate('hostId', 'name email picture phone');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is part of this booking
    const isRenter = booking.renterId._id.toString() === req.user._id.toString();
    const isHost = booking.hostId._id.toString() === req.user._id.toString();

    if (!isRenter && !isHost) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Host approves booking
router.put('/:id/approve', checkJwt, attachUser, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is the host
    if (booking.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the host can approve bookings' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending bookings can be approved' });
    }

    booking.status = 'approved';
    await booking.save();

    await booking.populate(['vehicleId', 'renterId', 'hostId']);

    // Send notifications
    try {
      // Email to renter
      await sendBookingApprovedEmail(booking, booking.vehicleId);
      // Email to host
      await sendBookingApprovedEmailToHost(booking, booking.vehicleId);
      // WhatsApp to guest
      await sendBookingApprovedToGuest(booking, booking.renterId);

      // WhatsApp to host
      const hostPhone = booking.hostId.hostProfile?.phone;
      if (hostPhone) {
        const checkIn = new Date(booking.startDate).toLocaleDateString();
        const checkOut = new Date(booking.endDate).toLocaleDateString();
        const hostMessage = `✅ *Booking Confirmed / تم تأكيد الحجز*\n\n` +
          `*English:*\n` +
          `Your booking has been confirmed by admin!\n\n` +
          `Vehicle: ${booking.vehicleId.title}\n` +
          `Guest: ${booking.guestDetails.name}\n` +
          `Check-in: ${checkIn}\n` +
          `Check-out: ${checkOut}\n` +
          `Total: AED ${booking.finalTotal}\n\n` +
          `*عربي:*\n` +
          `تم تأكيد الحجز من قبل الإدارة!\n\n` +
          `المركبة: ${booking.vehicleId.title}\n` +
          `الضيف: ${booking.guestDetails.name}\n` +
          `الدخول: ${checkIn}\n` +
          `الخروج: ${checkOut}\n` +
          `الإجمالي: ${booking.finalTotal} درهم\n\n` +
          `View details / عرض التفاصيل: ${process.env.FRONTEND_URL}/host/dashboard`;

        await sendWhatsAppMessage(hostPhone, hostMessage);
      }
    } catch (notificationError) {
      console.error('Failed to send approval notifications:', notificationError);
    }

    res.json({
      message: 'Booking approved successfully',
      booking,
    });
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({ error: 'Failed to approve booking' });
  }
});

// Host declines booking
router.put('/:id/decline', checkJwt, attachUser, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is the host
    if (booking.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the host can decline bookings' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending bookings can be declined' });
    }

    booking.status = 'declined';
    await booking.save();

    await booking.populate(['vehicleId', 'renterId', 'hostId']);

    // Send decline email to renter
    try {
      await sendBookingDeclinedEmail(booking, booking.vehicleId);
    } catch (emailError) {
      console.error('Failed to send decline email:', emailError);
    }

    res.json({
      message: 'Booking declined',
      booking,
    });
  } catch (error) {
    console.error('Decline booking error:', error);
    res.status(500).json({ error: 'Failed to decline booking' });
  }
});

// Cancel booking
router.put('/:id/cancel', checkJwt, attachUser, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is part of this booking
    const isRenter = booking.renterId.toString() === req.user._id.toString();
    const isHost = booking.hostId.toString() === req.user._id.toString();

    if (!isRenter && !isHost) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({ error: 'This booking cannot be cancelled' });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledBy = isRenter ? 'renter' : 'host';
    booking.cancelledAt = new Date();

    await booking.save();

    await booking.populate(['vehicleId', 'renterId', 'hostId']);

    res.json({
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

module.exports = router;
