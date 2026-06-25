const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const { verifyFirebaseToken } = require('../middleware/auth');
const { sendVerificationEmail, sendWelcomeEmail } = require('../utils/email');

// Register or login user (called after Firebase authentication)
router.post('/register', verifyFirebaseToken, async (req, res) => {
  try {
    const { email, name, picture, platform = 'web' } = req.body;
    const supabaseUid = req.user.supabaseUid;

    // Check if user already exists
    let user = await User.findOne({ supabaseUid });

    if (user) {
      // Update last login and platform
      user.lastLogin = new Date();
      user.platform = platform;
      await user.save();

      return res.json({ user, message: 'User logged in successfully' });
    }

    // For specific anonymous flows or missing email, generate a placeholder
    const finalEmail = email || `anonymous_${supabaseUid}@mirhal.com`;

    // Create new user
    user = new User({
      supabaseUid,
      email: finalEmail,
      name: name || 'Guest User',
      picture,
      role: 'renter', // Default role
      emailVerified: false,
      platform,
      lastLogin: new Date()
    });

    try {
      await user.save();
    } catch (saveError) {
      // Handle race condition: if user was created by another request in the meantime
      if (saveError.code === 11000) {
        console.warn('⚠️ Duplicate user creation attempted (handled race condition)');
        user = await User.findOne({ supabaseUid });
        if (user) {
          // Update last login even if we caught the race condition
          user.lastLogin = new Date();
          user.platform = platform;
          await user.save();
          return res.status(200).json({ user, message: 'User logged in successfully (race condition handled)' });
        }
      }
      throw saveError; // Re-throw other errors
    }

    res.status(201).json({
      user,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Request to become a host
router.post('/request-host', verifyFirebaseToken, async (req, res) => {
  try {
    const { bio, phone, address } = req.body;
    const supabaseUid = req.user.supabaseUid;

    const user = await User.findOne({ supabaseUid });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'host' || user.role === 'both') {
      if (user.hostProfile.isApproved) {
        return res.status(400).json({ error: 'You are already a verified host' });
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user to host or both
    user.role = user.role === 'renter' ? 'host' : 'both';
    user.hostProfile = {
      isApproved: false,
      verificationToken,
      verificationExpires,
      bio,
      phone,
      address,
    };

    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      message: 'Host request submitted. Please check your email to verify your account.',
      user,
    });
  } catch (error) {
    console.error('Host request error:', error);
    res.status(500).json({ error: 'Failed to process host request' });
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      'hostProfile.verificationToken': token,
      'hostProfile.verificationExpires': { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
      });
    }

    // Update user
    user.emailVerified = true;
    user.hostProfile.isApproved = true;
    user.hostProfile.verificationToken = undefined;
    user.hostProfile.verificationExpires = undefined;

    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.json({
      message: 'Email verified successfully! You can now list your vehicles.',
      user,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Get current user profile
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    const supabaseUid = req.user.supabaseUid;
    const user = await User.findOne({ supabaseUid });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;
