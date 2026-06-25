const express = require('express');
const { verifyFirebaseToken } = require('../middleware/auth');
const stripe = require('../config/stripe');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Review = require('../models/Review');
const Trail = require('../models/Trail');
const Report = require('../models/Report'); // Import Report model
const { updateVehicleRating } = require('./reviews');
const Booking = require('../models/Booking');
const { body, validationResult } = require('express-validator');
const {
  sendAdminApprovalToGuest,
  sendAdminRejectionToGuest,
  sendNewBookingNotificationToHost,
  sendHostApprovalEmail,
  sendHostRejectionEmail
} = require('../utils/emailService');
const { sendHostApprovalWhatsApp } = require('../utils/whatsappService');
const {
  syncFromGoogleSheets,
  exportToGoogleSheets,
  syncReviewsFromGoogleSheets,
  exportReviewsToGoogleSheets,
  syncTrailsFromGoogleSheets,
  exportTrailsToGoogleSheets
} = require('../services/googleSheetsService');

const router = express.Router();

// Specific Sheet IDs for Auto-Sync
const SHEET_IDS = {
  spots: '1rsjJgYTYzC0HS4qnEaji8k0OM272pdM6gSWHHLFuQD8',
  reviews: '1SC0qC-Cp21_SNnOYkqEbym3MVRF_hqbMFDMs9gt1Pk4',
  trails: '1MVGXhqc0sBGxwQpkvDFP49noVvszEIvB46O0glAkHi4'
};

// Helper to get Google Sheets Auth
const getSheetsAuth = async (req) => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  let credentials = {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    hostId: req.mongoUser?._id
  };

  if (!credentials.client_email || !credentials.private_key || credentials.private_key.length < 500) {
    const fs = require('fs');
    const path = require('path');
    const serverDir = path.join(__dirname, '..');
    const files = fs.readdirSync(serverDir);
    const jsonKeyFile = files.find(f => f.endsWith('.json') && f.includes('sync') && !f.includes('package'));

    if (jsonKeyFile) {
      const keyData = JSON.parse(fs.readFileSync(path.join(serverDir, jsonKeyFile), 'utf8'));
      credentials.client_email = keyData.client_email;
      credentials.private_key = keyData.private_key;
    }
  }
  return { spreadsheetId, credentials };
};

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  try {
    // req.user is already populated by verifyFirebaseToken (which is checkJwt)
    const user = req.user;
    if (!user || (!user.isAdmin && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.mongoUser = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization failed' });
  }
};

// ============ DASHBOARD STATS ============
router.get('/stats', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    const stats = {
      totalBookings: await Booking.countDocuments(),
      pendingBookings: await Booking.countDocuments({ status: 'pending' }),
      totalRevenue: await Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$finalTotal' } } }
      ]).then(result => result[0]?.total || 0),
      totalPlatformFees: await Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$serviceFee' } } }
      ]).then(result => result[0]?.total || 0),
      totalVehicles: await Vehicle.countDocuments(),
      pendingVehicles: await Vehicle.countDocuments({ approvalStatus: 'pending' }),

      // User Stats
      totalUsers: await User.countDocuments(),
      activeUsers: await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } }),
      iosUsers: await User.countDocuments({ platform: 'ios' }),
      androidUsers: await User.countDocuments({ platform: 'android' }),
      webUsers: await User.countDocuments({ platform: 'web' }),
    };
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ============ BOOKINGS ============
router.get('/bookings', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};

    const bookings = await Booking.find(query)
      .populate('vehicleId', 'title type images price')
      .populate('renterId', 'name email')
      .populate('hostId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ============ VEHICLE APPROVAL ============
router.get('/vehicles/all', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const vehicles = await Vehicle.find({})
      .populate('hostId', 'name email picture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Vehicle.countDocuments({});
    res.json({
      vehicles,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

router.get('/vehicles/pending', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ approvalStatus: 'pending' })
      .populate('hostId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ vehicles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending vehicles' });
  }
});

router.post('/vehicles/:id/approve', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    vehicle.approvalStatus = 'approved';
    vehicle.approvedBy = req.mongoUser._id;
    vehicle.approvedAt = new Date();
    vehicle.isActive = true;
    await vehicle.save();

    // Auto-sync to Google Sheets
    try {
      const { credentials } = await getSheetsAuth(req);
      const spreadsheetId = SHEET_IDS.spots;
      if (spreadsheetId && credentials.client_email) {
        console.log('📊 Auto-syncing approved spot to Google Sheets...');
        await exportToGoogleSheets(spreadsheetId, credentials);
        console.log('✅ Spot synced to Google Sheets');
      }
    } catch (syncError) {
      console.error('⚠️ Google Sheets sync failed:', syncError.message);
    }

    res.json({ message: 'Vehicle approved and synced to Google Sheets', vehicle });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve vehicle' });
  }
});

router.post('/vehicles/:id/reject', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    vehicle.approvalStatus = 'rejected';
    vehicle.rejectionReason = reason;
    vehicle.isActive = false;
    await vehicle.save();

    // Auto-sync to Google Sheets (Update status to rejected)
    try {
      const { credentials } = await getSheetsAuth(req);
      const spreadsheetId = SHEET_IDS.spots;
      if (spreadsheetId && credentials.client_email) {
        console.log('📊 Auto-syncing rejected spot to Google Sheets...');
        await exportToGoogleSheets(spreadsheetId, credentials);
        console.log('✅ Rejected spot synced to Google Sheets');
      }
    } catch (syncError) {
      console.error('⚠️ Google Sheets sync failed:', syncError.message);
    }

    res.json({ message: 'Vehicle rejected', vehicle });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject vehicle' });
  }
});

// ============ BOOKING APPROVAL ============
router.get('/bookings/pending-admin', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find({ adminApprovalStatus: 'pending' })
      .populate('vehicleId', 'title type images price')
      .populate('renterId', 'name email picture')
      .populate('hostId', 'name email picture')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({ error: 'Failed to fetch pending bookings' });
  }
});

router.post('/bookings/:id/approve', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('vehicleId')
      .populate('renterId', 'name email')
      .populate('hostId', 'name email');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.adminApprovalStatus !== 'pending') {
      return res.status(400).json({ error: 'Booking already processed' });
    }

    // Update admin approval status
    booking.adminApprovalStatus = 'approved';
    booking.adminApprovedAt = new Date();
    booking.adminApprovedBy = req.user.email;
    await booking.save();

    console.log('✅ Admin approved booking:', booking._id);

    // Send emails in sequence
    try {
      // 1. Send approval email to guest
      await sendAdminApprovalToGuest(booking, booking.renterId, booking.vehicleId);

      // 2. Send notification to host
      await sendNewBookingNotificationToHost(booking, booking.renterId, booking.vehicleId, booking.hostId);
    } catch (emailError) {
      console.error('Error sending approval emails:', emailError);
      // Continue even if emails fail
    }

    res.json({
      message: 'Booking approved by admin. Host has been notified.',
      booking
    });
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ error: 'Failed to approve booking' });
  }
});

router.post('/bookings/:id/reject', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate('vehicleId')
      .populate('renterId', 'name email');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.adminApprovalStatus !== 'pending') {
      return res.status(400).json({ error: 'Booking already processed' });
    }

    // Update admin approval status
    booking.adminApprovalStatus = 'rejected';
    booking.adminRejectionReason = reason;
    booking.status = 'cancelled';
    booking.cancelledBy = 'admin';
    booking.cancelledAt = new Date();

    // Process refund if payment was made
    if (booking.paymentIntentId && booking.paymentStatus === 'paid') {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.paymentIntentId,
          reason: 'requested_by_customer',
        });
        booking.paymentStatus = 'refunded';
        console.log('💰 Refund processed:', refund.id);
      } catch (refundError) {
        console.error('Error processing refund:', refundError);
        // Continue even if refund fails - can be handled manually
      }
    }

    await booking.save();

    console.log('❌ Admin rejected booking:', booking._id);

    // Send rejection email to guest
    try {
      await sendAdminRejectionToGuest(booking, booking.renterId, booking.vehicleId, reason);
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
    }

    res.json({
      message: 'Booking rejected. Guest has been notified and refund processed.',
      booking
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ error: 'Failed to reject booking' });
  }
});

// ============ HOST APPROVAL ============
router.get('/hosts/pending', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    console.log('📋 Fetching pending hosts...');
    const users = await User.find({
      'hostProfile.status': 'pending'
    }).sort({ 'hostProfile.requestedAt': -1 });

    console.log(`✅ Found ${users.length} pending hosts`);
    console.log('Pending hosts:', users.map(u => ({ email: u.email, status: u.hostProfile?.status })));

    res.json({ hosts: users });
  } catch (error) {
    console.error('❌ Error fetching pending hosts:', error);
    res.status(500).json({ error: 'Failed to fetch pending hosts' });
  }
});

router.post('/hosts/:userId/approve', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.hostProfile || user.hostProfile.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid host application status' });
    }

    user.hostProfile.status = 'approved';
    user.hostProfile.approvedAt = new Date();
    user.hostProfile.approvedBy = req.user.email;
    user.isHost = true;
    await user.save();

    console.log('✅ Host approved:', user.email);

    // Send notifications
    try {
      // Email to host
      await sendHostApprovalEmail(user);
      // WhatsApp to host
      await sendHostApprovalWhatsApp(user);
    } catch (notificationError) {
      console.error('Error sending host approval notifications:', notificationError);
    }

    res.json({ message: 'Host application approved', user });
  } catch (error) {
    console.error('Error approving host:', error);
    res.status(500).json({ error: 'Failed to approve host' });
  }
});

router.post('/hosts/:userId/reject', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.hostProfile || user.hostProfile.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid host application status' });
    }

    user.hostProfile.status = 'rejected';
    user.hostProfile.rejectionReason = reason;
    user.isHost = false;
    await user.save();

    console.log('❌ Host rejected:', user.email);

    // Send host rejection email
    try {
      await sendHostRejectionEmail(user, reason);
    } catch (emailError) {
      console.error('Error sending host rejection email:', emailError);
      // Continue even if email fails
    }

    res.json({ message: 'Host application rejected', user });
  } catch (error) {
    console.error('Error rejecting host:', error);
    res.status(500).json({ error: 'Failed to reject host' });
  }
});

// ============ REVIEW APPROVAL ============
router.get('/reviews/pending', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const reviews = await Review.find({ approvalStatus: 'pending' })
      .populate('reviewerId', 'name email')
      .populate('vehicleId', 'title')
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending reviews' });
  }
});

router.post('/reviews/:id/approve', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    review.approvalStatus = 'approved';
    review.isPublic = true;
    await review.save();

    if (review.reviewType === 'vehicle') {
      await updateVehicleRating(review.vehicleId);
    }

    // Auto-sync to Google Sheets (Update status to approved)
    try {
      const { credentials } = await getSheetsAuth(req);
      const spreadsheetId = SHEET_IDS.reviews;
      if (spreadsheetId && credentials.client_email) {
        console.log('📊 Auto-syncing status change to Google Sheets...');
        await exportReviewsToGoogleSheets(spreadsheetId, credentials);
        console.log('✅ Review status synced to Google Sheets');
      }
    } catch (syncError) {
      console.error('⚠️ Google Sheets sync failed:', syncError.message);
    }

    res.json({ message: 'Review approved', review });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve review' });
  }
});

router.post('/reviews/:id/reject', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    review.approvalStatus = 'rejected';
    review.rejectionReason = reason;
    review.isPublic = false;
    await review.save();

    // Auto-sync to Google Sheets (Update status to rejected)
    try {
      const { credentials } = await getSheetsAuth(req);
      const spreadsheetId = SHEET_IDS.reviews;
      if (spreadsheetId && credentials.client_email) {
        console.log('📊 Auto-syncing rejected review to Google Sheets...');
        await exportReviewsToGoogleSheets(spreadsheetId, credentials);
        console.log('✅ Rejected review synced to Google Sheets');
      }
    } catch (syncError) {
      console.error('⚠️ Google Sheets sync failed:', syncError.message);
    }

    res.json({ message: 'Review rejected', review });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject review' });
  }
});

router.get('/reviews/all', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('reviewerId', 'name email picture')
      .populate('vehicleId', 'title name')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch all reviews' });
  }
});

router.delete('/reviews/:id', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    // Update vehicle rating if needed
    if (review.vehicleId) {
      await updateVehicleRating(review.vehicleId);
    }

    // Auto-sync to Google Sheets (Will remove the row because export sends all existing reviews)
    try {
      const { credentials } = await getSheetsAuth(req);
      const spreadsheetId = SHEET_IDS.reviews;
      if (spreadsheetId && credentials.client_email) {
        console.log('📊 Auto-syncing review deletion to Google Sheets...');
        await exportReviewsToGoogleSheets(spreadsheetId, credentials);
        console.log('✅ Review deletion synced to Google Sheets');
      }
    } catch (syncError) {
      console.error('⚠️ Google Sheets sync failed:', syncError.message);
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ============ VEHICLE MANAGEMENT (ADMIN) ============
router.post(
  '/vehicles',
  verifyFirebaseToken,
  requireAdmin,
  [
    body('hostId').isMongoId(),
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('type').isIn(['Class A', 'Class B', 'Class C', 'Travel Trailer', 'Fifth Wheel', 'Camper Van', 'Toy Hauler', 'Pop-up Camper']),
    body('year').isInt({ min: 1950, max: new Date().getFullYear() + 1 }),
    body('make').trim().notEmpty(),
    body('model').trim().notEmpty(),
    body('length').isFloat({ min: 0 }),
    body('sleeps').isInt({ min: 1 }),
    body('price').isFloat({ min: 0 }),
    body('location.address').trim().notEmpty(),
    body('location.city').trim().notEmpty(),
    body('location.state').trim().notEmpty(),
    body('location.zipCode').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const vehicleData = {
        ...req.body,
        approvalStatus: 'approved',
        approvedBy: req.mongoUser._id,
        approvedAt: new Date(),
        isActive: true,
      };

      const vehicle = new Vehicle(vehicleData);
      await vehicle.save();

      console.log('✅ Vehicle created by admin:', vehicle._id);

      // Auto-sync to Google Sheets
      try {
        const { credentials } = await getSheetsAuth(req);
        const spreadsheetId = SHEET_IDS.spots;
        if (spreadsheetId && credentials.client_email) {
          console.log('📊 Auto-syncing new spot to Google Sheets...');
          await exportToGoogleSheets(spreadsheetId, credentials);
          console.log('✅ New spot synced to Google Sheets');
        }
      } catch (syncError) {
        console.error('⚠️ Google Sheets sync failed:', syncError.message);
      }

      res.status(201).json({
        message: 'Vehicle created successfully by admin',
        vehicle,
      });
    } catch (error) {
      console.error('Admin create vehicle error:', error);
      res.status(500).json({ error: 'Failed to create vehicle' });
    }
  }
);

router.put('/vehicles/:id', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    console.log('✅ Vehicle updated by admin:', vehicle._id);

    // Auto-sync to Google Sheets
    try {
      const { credentials } = await getSheetsAuth(req);
      const spreadsheetId = SHEET_IDS.spots;
      if (spreadsheetId && credentials.client_email) {
        console.log('📊 Auto-syncing updated spot to Google Sheets...');
        await exportToGoogleSheets(spreadsheetId, credentials);
        console.log('✅ Updated spot synced to Google Sheets');
      }
    } catch (syncError) {
      console.error('⚠️ Google Sheets sync failed:', syncError.message);
    }

    res.json({ message: 'Vehicle updated successfully', vehicle });
  } catch (error) {
    console.error('Admin update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// ============ HOSTS ============
router.get('/hosts/all', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const hosts = await User.find({ isHost: true }).select('_id name email').sort({ name: 1 });
    res.json({ hosts });
  } catch (error) {
    console.error('Error fetching all hosts:', error);
    res.status(500).json({ error: 'Failed to fetch hosts' });
  }
});

// ============ USERS LIST ============
router.get('/users', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ============ REPORTS ============
router.get('/reports', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    // Populate spotId to get current spot details (image, host)
    const reports = await Report.find(query)
      .populate('spotId', 'title images hostId')
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.post('/reports/:id/resolve', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    report.status = 'resolved';
    report.resolvedAt = new Date();
    report.resolvedBy = req.mongoUser.email;
    await report.save();

    res.json({ message: 'Report resolved', report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});

router.post('/reports/:id/dismiss', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    report.status = 'dismissed';
    report.resolvedAt = new Date();
    report.resolvedBy = req.mongoUser.email;
    await report.save();

    res.json({ message: 'Report dismissed', report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to dismiss report' });
  }
});

// ============ DELETE ACTIONS ============
router.delete('/vehicles/:id', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Auto-sync to Google Sheets (Will remove the row because export sends all existing spots)
    try {
      const { credentials } = await getSheetsAuth(req);
      const spreadsheetId = SHEET_IDS.spots;
      if (spreadsheetId && credentials.client_email) {
        console.log('📊 Auto-syncing deletion to Google Sheets...');
        await exportToGoogleSheets(spreadsheetId, credentials);
        console.log('✅ Deletion synced to Google Sheets');
      }
    } catch (syncError) {
      console.error('⚠️ Google Sheets sync failed:', syncError.message);
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

router.delete('/users/:id', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Note: This doesn't delete from Firebase, just from MongoDB
    res.json({ message: 'User deleted from database successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============ TEMPORARY PUBLIC SYNC (REMOVE AFTER USE) ============
router.get('/public-sync-spots', async (req, res) => {
  try {
    const spreadsheetId = SHEET_IDS.spots; // Use the constant defined at top of file

    let credentials = {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      hostId: '507f1f77bcf86cd799439011'
    };

    // Fallback: Check for a service account JSON file in the server directory
    if (!credentials.client_email || !credentials.private_key || credentials.private_key.length < 500) {
      const fs = require('fs');
      const path = require('path');
      const serverDir = path.join(__dirname, '..');
      const files = fs.readdirSync(serverDir);
      const jsonKeyFile = files.find(f => f.endsWith('.json') && f.includes('sync') && !f.includes('package'));

      if (jsonKeyFile) {
        console.log(`📡 Loading sync credentials from ${jsonKeyFile}`);
        const keyData = JSON.parse(fs.readFileSync(path.join(serverDir, jsonKeyFile), 'utf8'));
        credentials.client_email = keyData.client_email;
        credentials.private_key = keyData.private_key;
      }
    }

    if (!spreadsheetId || !credentials.client_email || !credentials.private_key) {
      return res.status(500).json({
        error: 'Credentials missing. Please ensure the JSON key file is in the server directory.'
      });
    }

    console.log(`Starting public sync for sheet: ${spreadsheetId}`);
    const results = await syncFromGoogleSheets(spreadsheetId, credentials);
    res.json({
      message: 'Public sync completed successfully',
      results
    });
  } catch (error) {
    console.error('Public Sync Error:', error);
    res.status(500).json({ error: `Sync failed: ${error.message}` });
  }
});

router.get('/public-sync-reviews', async (req, res) => {
  try {
    const spreadsheetId = SHEET_IDS.reviews;

    let credentials = {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      hostId: '507f1f77bcf86cd799439011'
    };

    // Fallback: Check for local JSON key
    if (!credentials.client_email || !credentials.private_key || credentials.private_key.length < 500) {
      const fs = require('fs');
      const path = require('path');
      const serverDir = path.join(__dirname, '..');
      const files = fs.readdirSync(serverDir);
      const jsonKeyFile = files.find(f => f.endsWith('.json') && f.includes('sync') && !f.includes('package'));
      if (jsonKeyFile) {
        const keyData = JSON.parse(fs.readFileSync(path.join(serverDir, jsonKeyFile), 'utf8'));
        credentials.client_email = keyData.client_email;
        credentials.private_key = keyData.private_key;
      }
    }

    if (!spreadsheetId || !credentials.client_email || !credentials.private_key) {
      return res.status(500).json({ error: 'Credentials missing' });
    }

    const results = await syncReviewsFromGoogleSheets(spreadsheetId, credentials);
    res.json({ message: 'Reviews sync completed', results });
  } catch (error) {
    res.status(500).json({ error: `Sync failed: ${error.message}` });
  }
});

router.get('/public-sync-trails', async (req, res) => {
  try {
    const spreadsheetId = SHEET_IDS.trails;

    let credentials = {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      hostId: '507f1f77bcf86cd799439011'
    };

    // Fallback: Check for local JSON key
    if (!credentials.client_email || !credentials.private_key || credentials.private_key.length < 500) {
      const fs = require('fs');
      const path = require('path');
      const serverDir = path.join(__dirname, '..');
      const files = fs.readdirSync(serverDir);
      const jsonKeyFile = files.find(f => f.endsWith('.json') && f.includes('sync') && !f.includes('package'));
      if (jsonKeyFile) {
        const keyData = JSON.parse(fs.readFileSync(path.join(serverDir, jsonKeyFile), 'utf8'));
        credentials.client_email = keyData.client_email;
        credentials.private_key = keyData.private_key;
      }
    }

    if (!spreadsheetId || !credentials.client_email || !credentials.private_key) {
      return res.status(500).json({ error: 'Credentials missing' });
    }

    const results = await syncTrailsFromGoogleSheets(spreadsheetId, credentials);
    res.json({ message: 'Trails sync completed', results });
  } catch (error) {
    res.status(500).json({ error: `Sync failed: ${error.message}` });
  }
});

// ============ GOOGLE SHEETS SYNC ============
router.post('/sync-spots', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { spreadsheetId } = req.body;

    let credentials = {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      hostId: req.mongoUser._id
    };

    // Fallback: Check for a service account JSON file in the server directory
    // This is more robust than .env for long private keys
    if (!credentials.client_email || !credentials.private_key || credentials.private_key.length < 500) {
      const fs = require('fs');
      const path = require('path');
      const serverDir = path.join(__dirname, '..');
      const files = fs.readdirSync(serverDir);
      const jsonKeyFile = files.find(f => f.endsWith('.json') && f.includes('sync') && !f.includes('package'));

      if (jsonKeyFile) {
        console.log(`📡 Loading sync credentials from ${jsonKeyFile}`);
        const keyData = JSON.parse(fs.readFileSync(path.join(serverDir, jsonKeyFile), 'utf8'));
        credentials.client_email = keyData.client_email;
        credentials.private_key = keyData.private_key;
      }
    }

    if (!spreadsheetId || !credentials.client_email || !credentials.private_key) {
      return res.status(400).json({
        error: 'Spreadsheet ID and Credentials are required. Set them in .env or place a service account JSON file in the server/ directory.'
      });
    }


    const results = await syncFromGoogleSheets(spreadsheetId, credentials);
    res.json({
      message: 'Sync completed successfully',
      results
    });
  } catch (error) {
    console.error('Admin Sync Error:', error);
    res.status(500).json({ error: `Sync failed: ${error.message}` });
  }
});

// ============ GOOGLE SHEETS EXPORT ============
router.post('/export-to-sheet', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { spreadsheetId } = req.body;

    let credentials = {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      hostId: req.mongoUser._id
    };

    // Fallback: Check for a service account JSON file in the server directory
    if (!credentials.client_email || !credentials.private_key || credentials.private_key.length < 500) {
      const fs = require('fs');
      const path = require('path');
      const serverDir = path.join(__dirname, '..');
      const files = fs.readdirSync(serverDir);
      const jsonKeyFile = files.find(f => f.endsWith('.json') && f.includes('sync') && !f.includes('package'));

      if (jsonKeyFile) {
        console.log(`📡 Loading export credentials from ${jsonKeyFile}`);
        const keyData = JSON.parse(fs.readFileSync(path.join(serverDir, jsonKeyFile), 'utf8'));
        credentials.client_email = keyData.client_email;
        credentials.private_key = keyData.private_key;
      }
    }

    if (!spreadsheetId || !credentials.client_email || !credentials.private_key) {
      return res.status(400).json({
        error: 'Spreadsheet ID and Credentials are required. Set them in .env or place a service account JSON file in the server/ directory.'
      });
    }

    const results = await exportToGoogleSheets(spreadsheetId, credentials);
    res.json({
      message: 'Export completed successfully',
      results
    });
  } catch (error) {
    console.error('Admin Export Error:', error);
    res.status(500).json({ error: `Export failed: ${error.message}` });
  }
});

// ============ REVIEW SYNC ============
router.post('/sync-reviews', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { spreadsheetId } = req.body;
    let credentials = {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    // Fallback: Check for a service account JSON file in the server directory
    if (!credentials.client_email || !credentials.private_key || credentials.private_key.length < 500) {
      const fs = require('fs');
      const path = require('path');
      const serverDir = path.join(__dirname, '..');
      const files = fs.readdirSync(serverDir);
      const jsonKeyFile = files.find(f => f.endsWith('.json') && f.includes('sync') && !f.includes('package'));

      if (jsonKeyFile) {
        console.log(`📡 Loading review sync credentials from ${jsonKeyFile}`);
        const keyData = JSON.parse(fs.readFileSync(path.join(serverDir, jsonKeyFile), 'utf8'));
        credentials.client_email = keyData.client_email;
        credentials.private_key = keyData.private_key;
      }
    }

    if (!spreadsheetId || !credentials.client_email || !credentials.private_key) {
      return res.status(400).json({ error: 'Spreadsheet ID and Credentials are required.' });
    }

    const results = await syncReviewsFromGoogleSheets(spreadsheetId, credentials);
    res.json({ message: 'Review sync completed', results });
  } catch (error) {
    console.error('Review Sync Error:', error);
    res.status(500).json({ error: `Review sync failed: ${error.message}` });
  }
});

// ============ REVIEW EXPORT ============
router.post('/export-reviews', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { spreadsheetId } = req.body;
    let credentials = {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    // Fallback logic
    if (!credentials.client_email || !credentials.private_key || credentials.private_key.length < 500) {
      const fs = require('fs');
      const path = require('path');
      const serverDir = path.join(__dirname, '..');
      const files = fs.readdirSync(serverDir);
      const jsonKeyFile = files.find(f => f.endsWith('.json') && f.includes('sync') && !f.includes('package'));

      if (jsonKeyFile) {
        const keyData = JSON.parse(fs.readFileSync(path.join(serverDir, jsonKeyFile), 'utf8'));
        credentials.client_email = keyData.client_email;
        credentials.private_key = keyData.private_key;
      }
    }

    if (!spreadsheetId || !credentials.client_email || !credentials.private_key) {
      return res.status(400).json({ error: 'Spreadsheet ID and Credentials are required.' });
    }

    const results = await exportReviewsToGoogleSheets(spreadsheetId, credentials);
    res.json({ message: 'Review export completed', results });
  } catch (error) {
    console.error('Review Export Error:', error);
    res.status(500).json({ error: `Review export failed: ${error.message}` });
  }
});

// ============ TRAILS SYNC ============
router.post('/sync-trails', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { spreadsheetId } = req.body;
    let credentials = {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    // Fallback logic
    if (!credentials.client_email || !credentials.private_key || credentials.private_key.length < 500) {
      const fs = require('fs');
      const path = require('path');
      const serverDir = path.join(__dirname, '..');
      const files = fs.readdirSync(serverDir);
      const jsonKeyFile = files.find(f => f.endsWith('.json') && f.includes('sync') && !f.includes('package'));

      if (jsonKeyFile) {
        const keyData = JSON.parse(fs.readFileSync(path.join(serverDir, jsonKeyFile), 'utf8'));
        credentials.client_email = keyData.client_email;
        credentials.private_key = keyData.private_key;
      }
    }

    if (!spreadsheetId || !credentials.client_email || !credentials.private_key) {
      return res.status(400).json({ error: 'Spreadsheet ID and Credentials are required.' });
    }

    const results = await syncTrailsFromGoogleSheets(spreadsheetId, credentials);
    res.json({ message: 'Trails sync completed', results });
  } catch (error) {
    console.error('Trails Sync Error:', error);
    res.status(500).json({ error: `Trails sync failed: ${error.message}` });
  }
});

router.post('/export-trails', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { spreadsheetId } = req.body;
    let credentials = {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    // Fallback logic
    if (!credentials.client_email || !credentials.private_key || credentials.private_key.length < 500) {
      const fs = require('fs');
      const path = require('path');
      const serverDir = path.join(__dirname, '..');
      const files = fs.readdirSync(serverDir);
      const jsonKeyFile = files.find(f => f.endsWith('.json') && f.includes('sync') && !f.includes('package'));

      if (jsonKeyFile) {
        const keyData = JSON.parse(fs.readFileSync(path.join(serverDir, jsonKeyFile), 'utf8'));
        credentials.client_email = keyData.client_email;
        credentials.private_key = keyData.private_key;
      }
    }

    if (!spreadsheetId || !credentials.client_email || !credentials.private_key) {
      return res.status(400).json({ error: 'Spreadsheet ID and Credentials are required.' });
    }

    const results = await exportTrailsToGoogleSheets(spreadsheetId, credentials);
    res.json({ message: 'Trails export completed', results });
  } catch (error) {
    console.error('Trails Export Error:', error);
    res.status(500).json({ error: `Trails export failed: ${error.message}` });
  }
});

// ============ REVIEW MODERATION ============
router.get('/reviews/pending', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const reviews = await Review.find({ approvalStatus: 'pending' })
      .populate('reviewerId', 'name email picture')
      .populate('vehicleId', 'title name')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch pending reviews' });
  }
});

router.post('/reviews/:id/approve', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.approvalStatus = 'approved';
    review.isPublic = true;
    await review.save();

    // Update vehicle rating
    if (review.vehicleId) {
      await updateVehicleRating(review.vehicleId);
    }

    // Auto-sync to Google Sheets
    try {
      const { spreadsheetId, credentials } = await getSheetsAuth(req);
      if (spreadsheetId && credentials.client_email) {
        console.log('📊 Auto-syncing approved review to Google Sheets...');
        await exportReviewsToGoogleSheets(spreadsheetId, credentials);
        console.log('✅ Review synced to Google Sheets');
      }
    } catch (syncError) {
      console.error('⚠️ Google Sheets sync failed:', syncError.message);
    }

    res.json({ message: 'Review approved and synced to Google Sheets', review });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({ error: 'Failed to approve review' });
  }
});

router.post('/reviews/:id/reject', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.approvalStatus = 'rejected';
    review.isPublic = false;
    await review.save();

    // Auto-sync to Google Sheets
    try {
      const { spreadsheetId, credentials } = await getSheetsAuth(req);
      if (spreadsheetId && credentials.client_email) {
        console.log('📊 Auto-syncing rejected review to Google Sheets...');
        await exportReviewsToGoogleSheets(spreadsheetId, credentials);
        console.log('✅ Review synced to Google Sheets');
      }
    } catch (syncError) {
      console.error('⚠️ Google Sheets sync failed:', syncError.message);
    }

    res.json({ message: 'Review rejected', review });
  } catch (error) {
    console.error('Reject review error:', error);
    res.status(500).json({ error: 'Failed to reject review' });
  }
});

// ============ TRAILS APPROVAL ============
router.post('/trails/:id/approve', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const trail = await Trail.findById(req.params.id);
    if (!trail) return res.status(404).json({ error: 'Trail not found' });

    trail.approvalStatus = 'approved';
    trail.isPublic = true;
    await trail.save();

    // Auto-sync to Google Sheets
    try {
      const { credentials } = await getSheetsAuth(req);
      const spreadsheetId = SHEET_IDS.trails;
      if (spreadsheetId && credentials.client_email) {
        console.log('📊 Auto-syncing approved trail to Google Sheets...');
        await exportTrailsToGoogleSheets(spreadsheetId, credentials);
        console.log('✅ Trail synced to Google Sheets');
      }
    } catch (syncError) {
      console.error('⚠️ Google Sheets sync failed:', syncError.message);
    }

    res.json({ message: 'Trail approved and synced', trail });
  } catch (error) {
    console.error('Approve trail error:', error);
    res.status(500).json({ error: 'Failed to approve trail' });
  }
});

router.delete('/trails/:id', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const trail = await Trail.findByIdAndDelete(req.params.id);
    if (!trail) return res.status(404).json({ error: 'Trail not found' });

    // Auto-sync to Google Sheets
    try {
      const { credentials } = await getSheetsAuth(req);
      const spreadsheetId = SHEET_IDS.trails;
      if (spreadsheetId && credentials.client_email) {
        console.log('📊 Auto-syncing trail deletion to Google Sheets...');
        await exportTrailsToGoogleSheets(spreadsheetId, credentials);
        console.log('✅ Trail deletion synced to Google Sheets');
      }
    } catch (syncError) {
      console.error('⚠️ Google Sheets sync failed:', syncError.message);
    }

    res.json({ message: 'Trail deleted successfully' });
  } catch (error) {
    console.error('Delete trail error:', error);
    res.status(500).json({ error: 'Failed to delete trail' });
  }
});

// Temporary endpoint removed

// ============ FORCE REPAIR (DEBUGGING) ============
router.get('/force-auto-repair-now', async (req, res) => {
  try {
    const { runAutoRepair } = require('../utils/autoRepair');
    console.log('🔧 Manual repair triggered via API');

    // Capture the Detailed Logs
    const result = await runAutoRepair();

    res.json({
      success: true,
      message: 'Repair script finished.',
      details: result,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Repair failed: ' + error.message });
  }
});

module.exports = router;
