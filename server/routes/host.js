const express = require('express');
const { verifyFirebaseToken } = require('../middleware/auth');
const { getUserByFirebaseUid } = require('../middleware/user-sync');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const User = require('../models/User');
const stripe = require('../config/stripe');
const { validateVehicle, validateObjectId, validateHostRequest, validateCancellation } = require('../middleware/validators');
const { sendBookingApprovalEmail, sendBookingDeclinedEmail } = require('../utils/emailService');
const { sendAdminHostRequestEmail } = require('../services/emailService');
const { sendNewHostRequestToAdmin, sendHostApprovalWhatsApp } = require('../utils/whatsappService');

const router = express.Router();

// Middleware to ensure user is a host
const requireHost = async (req, res, next) => {
  try {
    const user = await getUserByFirebaseUid(req.user.uid);
    if (user.role !== 'host' && user.role !== 'both') {
      return res.status(403).json({ error: 'Host access required' });
    }
    req.mongoUser = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization failed' });
  }
};

// ==== HOST PROFILE ====

// Request to become a host
router.post('/request-access', verifyFirebaseToken, validateHostRequest, async (req, res) => {
  try {
    const user = await getUserByFirebaseUid(req.user.uid);

    if (user.role === 'host' || user.role === 'both') {
      return res.status(400).json({ error: 'Already a host' });
    }

    user.role = 'both'; // Can be both renter and host
    user.hostProfile = {
      approvalStatus: 'pending',
      requestedAt: new Date(),
      bio: req.body.bio || '',
      phone: req.body.phone || '',
      address: req.body.address || {},
    };

    await user.save();

    // Send WhatsApp notification to admin
    try {
      await sendNewHostRequestToAdmin(user);
    } catch (whatsappError) {
      console.error('Failed to send admin WhatsApp notification:', whatsappError);
    }

    // Send Email notification to admin
    try {
      await sendAdminHostRequestEmail(user);
    } catch (emailError) {
      console.error('Failed to send admin email notification:', emailError);
    }

    console.log(`✋ Host access requested by: ${user.name}`);

    res.json({ message: 'Host access requested. Awaiting admin approval.' });
  } catch (error) {
    console.error('Error requesting host access:', error);
    res.status(500).json({ error: 'Failed to request host access' });
  }
});

// ==== VEHICLE LISTINGS ====

// Get host's own vehicles
router.get('/my-vehicles', verifyFirebaseToken, requireHost, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ hostId: req.mongoUser._id })
      .sort({ createdAt: -1 });

    res.json({ vehicles });
  } catch (error) {
    console.error('Error fetching host vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Create a new vehicle listing
router.post('/vehicles', verifyFirebaseToken, requireHost, validateVehicle, async (req, res) => {
  try {
    const host = req.mongoUser;

    // Check if host is approved
    if (!host.hostProfile?.isApproved) {
      return res.status(403).json({ error: 'Host account not yet approved by admin' });
    }

    // Only allow specific fields from request body (prevent field injection)
    const allowedFields = [
      'title', 'description', 'type', 'pricePerDay', 'capacity',
      'location', 'images', 'amenities', 'rules', 'year', 'make', 'model'
    ];

    const vehicleData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        vehicleData[field] = req.body[field];
      }
    });

    const vehicle = new Vehicle({
      hostId: host._id,
      ...vehicleData,
      approvalStatus: 'pending', // Requires admin approval
      isActive: false, // Inactive until approved
    });

    await vehicle.save();

    console.log(`🚐 New vehicle listing submitted: ${vehicle.title}`);

    res.status(201).json({
      message: 'Vehicle submitted for approval',
      vehicle
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle listing' });
  }
});

// Update vehicle listing
router.put('/vehicles/:id', verifyFirebaseToken, requireHost, validateObjectId('id'), validateVehicle, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      hostId: req.mongoUser._id
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Only allow specific fields from request body (prevent field injection)
    const allowedFields = [
      'title', 'description', 'type', 'pricePerDay', 'capacity',
      'location', 'images', 'amenities', 'rules', 'year', 'make', 'model'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        vehicle[field] = req.body[field];
      }
    });

    // If vehicle was previously rejected and now being resubmitted
    if (vehicle.approvalStatus === 'rejected') {
      vehicle.approvalStatus = 'pending';
      vehicle.rejectionReason = undefined;
    }

    await vehicle.save();

    res.json({ message: 'Vehicle updated successfully', vehicle });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// Delete vehicle listing
router.delete('/vehicles/:id', verifyFirebaseToken, requireHost, validateObjectId('id'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      hostId: req.mongoUser._id
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if there are any active bookings
    const activeBookings = await Booking.countDocuments({
      vehicleId: vehicle._id,
      status: { $in: ['pending', 'approved'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        error: 'Cannot delete vehicle with active bookings'
      });
    }

    await vehicle.deleteOne();

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// ==== BOOKINGS ====

// Get bookings for host's vehicles
router.get('/bookings', verifyFirebaseToken, requireHost, async (req, res) => {
  try {
    // Only show bookings that have been approved by admin
    const bookings = await Booking.find({
      hostId: req.mongoUser._id,
      adminApprovalStatus: 'approved' // Only show admin-approved bookings
    })
      .populate('vehicleId', 'title images price')
      .populate('renterId', 'name email picture')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching host bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Approve a booking
router.post('/bookings/:id/approve', verifyFirebaseToken, requireHost, validateObjectId('id'), async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      hostId: req.mongoUser._id
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check that admin has approved first
    if (booking.adminApprovalStatus !== 'approved') {
      return res.status(400).json({ error: 'Booking must be approved by admin first' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Can only approve pending bookings' });
    }

    booking.status = 'approved';
    await booking.save();

    console.log(`✅ Booking approved by host: ${booking._id}`);

    // Send email notification to renter
    try {
      await booking.populate('vehicleId');
      await booking.populate('renterId');
      await booking.populate('hostId');

      await sendBookingApprovalEmail(
        booking,
        booking.renterId,
        booking.vehicleId,
        booking.hostId
      );
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      // Don't fail the approval if email fails
    }

    res.json({ message: 'Booking approved successfully', booking });
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ error: 'Failed to approve booking' });
  }
});

// Decline a booking
router.post('/bookings/:id/decline', verifyFirebaseToken, requireHost, validateObjectId('id'), validateCancellation, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findOne({
      _id: req.params.id,
      hostId: req.mongoUser._id
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check that admin has approved first
    if (booking.adminApprovalStatus !== 'approved') {
      return res.status(400).json({ error: 'Booking must be approved by admin first' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Can only decline pending bookings' });
    }

    booking.status = 'declined';
    booking.cancellationReason = reason;
    await booking.save();

    console.log(`❌ Booking declined by host: ${booking._id}`);

    // Initiate refund if payment was made
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

        console.log(`💰 Refund processed for declined booking: ${booking._id}, amount: $${refund.amount / 100}`);
      } catch (refundError) {
        console.error('Error processing refund:', refundError);
        // Don't fail the decline if refund fails - log for manual processing
        console.error(`⚠️ Manual refund needed for booking ${booking._id}`);
      }
    }

    // Send email notification to renter
    try {
      await booking.populate('vehicleId');
      await booking.populate('renterId');

      await sendBookingDeclinedEmail(
        booking,
        booking.renterId,
        booking.vehicleId,
        reason
      );
    } catch (emailError) {
      console.error('Error sending decline email:', emailError);
      // Don't fail the decline if email fails
    }

    res.json({
      message: 'Booking declined',
      booking,
      refund: refundInfo
    });
  } catch (error) {
    console.error('Error declining booking:', error);
    res.status(500).json({ error: 'Failed to decline booking' });
  }
});

// ==== DASHBOARD STATS ====
router.get('/stats', verifyFirebaseToken, requireHost, async (req, res) => {
  try {
    const host = req.mongoUser;

    const stats = {
      totalBookings: await Booking.countDocuments({
        hostId: host._id,
        adminApprovalStatus: 'approved' // Only count admin-approved bookings
      }),
      pendingBookings: await Booking.countDocuments({
        hostId: host._id,
        adminApprovalStatus: 'approved',
        status: 'pending'
      }),
      totalEarnings: await Booking.aggregate([
        {
          $match: {
            hostId: host._id,
            adminApprovalStatus: 'approved',
            paymentStatus: 'paid'
          }
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]).then(result => result[0]?.total || 0),
      totalVehicles: await Vehicle.countDocuments({ hostId: host._id }),
      approvedVehicles: await Vehicle.countDocuments({ hostId: host._id, approvalStatus: 'approved' }),
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching host stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
