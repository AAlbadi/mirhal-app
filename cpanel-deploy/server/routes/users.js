const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { checkJwt, requireHost } = require('../middleware/auth');
const { sendAdminHostRequestEmail } = require('../services/emailService');
const { sendNewHostRequestToAdmin } = require('../utils/whatsappService');

// Get user profile
router.get('/profile', checkJwt, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', checkJwt, async (req, res) => {
  try {
    const { name, bio, phone, address } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio) updateData['hostProfile.bio'] = bio;
    if (phone) updateData['hostProfile.phone'] = phone;
    if (address) updateData['hostProfile.address'] = address;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get public user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name picture hostProfile.bio hostProfile.address rating createdAt'
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Request to become a host (Simplified for MVP)
router.post('/request-host', checkJwt, async (req, res) => {
  try {
    console.log('🔍 Received host request from:', req.user?.email || req.user?.uid);
    console.log('📋 Request body:', req.body);
    const { phone, whatsapp, rvDetails, location, notes } = req.body;

    // User is already attached to req by checkJwt
    const user = req.user;

    // Check if already a host or has pending request
    if (user.isHost) {
      console.log('❌ User is already an approved host:', user.email);
      return res.status(400).json({ error: 'You are already approved as a host' });
    }

    // Allow updating pending requests - users can resubmit to update their information
    const isUpdating = user.hostProfile && user.hostProfile.status === 'pending';

    // Update host profile with schema-compliant data
    user.hostProfile = {
      status: 'pending',
      requestedAt: user.hostProfile?.requestedAt || new Date(), // Keep original request date if updating
      phone: phone || '',
      bio: `RV Details: ${rvDetails}\n\nNotes: ${notes}`, // Combine RV details and notes into bio
      address: {
        street: location,
        city: '',
        state: '',
        zipCode: '',
        country: '',
      }
    };

    await user.save();

    console.log(isUpdating ? '🔄 Host request updated:' : '📝 Host request submitted:', user.email);
    console.log('📞 Contact: Phone:', phone, '| WhatsApp:', whatsapp);
    console.log('🚐 RV:', rvDetails);

    // Send email to admin
    try {
      await sendAdminHostRequestEmail(user);
    } catch (emailError) {
      console.error('Error sending admin host request email:', emailError);
      // Continue even if email fails
    }

    // Send WhatsApp notification to admin
    try {
      await sendNewHostRequestToAdmin(user);
    } catch (whatsappError) {
      console.error('Error sending WhatsApp notification:', whatsappError);
      // Continue even if WhatsApp fails
    }

    res.json({
      message: isUpdating
        ? 'Host request updated successfully. Admin will review your updated information.'
        : 'Host request submitted successfully. Admin will contact you soon.',
      user,
      isUpdate: isUpdating
    });
  } catch (error) {
    console.error('❌ Error submitting host request:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to submit host request' });
  }
});

module.exports = router;

// Delete user account
router.delete('/me', checkJwt, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`🗑️ Deleting account for user: ${req.user.email}`);

    // 1. Soft delete user's vehicles/spots
    const Vehicle = require('../models/Vehicle');
    await Vehicle.updateMany(
      { hostId: userId },
      { $set: { approvalStatus: 'deleted', deletedAt: new Date() } }
    );
    console.log(`✅ Marked user's vehicles as deleted`);

    // 2. Anonymize user's reviews
    const Review = require('../models/Review');
    await Review.updateMany(
      { userId: userId },
      { $set: { userId: null, userName: 'Deleted User', userPicture: null } }
    );
    console.log(`✅ Anonymized user's reviews`);

    // 3. Cancel active bookings
    const Booking = require('../models/Booking');
    await Booking.updateMany(
      { renterId: userId, status: { $in: ['pending', 'confirmed'] } },
      { $set: { status: 'cancelled', cancelReason: 'User account deleted' } }
    );
    console.log(`✅ Cancelled active bookings`);

    // 4. Delete the user from MongoDB
    await User.findByIdAndDelete(userId);
    console.log(`✅ Deleted user from database`);

    res.json({
      message: 'Account deleted successfully',
      deleted: true
    });
  } catch (error) {
    console.error('❌ Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});
