const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  supabaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: false, // Changed to false to support anonymous users
    unique: true,
    sparse: true, // Allow multiple nulls/missing values
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
  },
  role: {
    type: String,
    enum: ['renter', 'host', 'both', 'admin'],
    default: 'renter',
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  stripeConnectAccountId: {
    type: String, // Stripe Connected Account ID for hosts
    sparse: true, // Only hosts have this
  },
  stripeAccountStatus: {
    type: String,
    enum: ['not_created', 'pending', 'active', 'restricted'],
    default: 'not_created',
  },
  isHost: {
    type: Boolean,
    default: false,
  },
  hostProfile: {
    status: {
      type: String,
      enum: ['not_requested', 'pending', 'approved', 'rejected'],
      default: 'not_requested',
    },
    approvedBy: {
      type: String, // Admin email
    },
    approvedAt: Date,
    rejectionReason: String,
    requestedAt: Date,
    bio: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  platform: {
    type: String,
    enum: ['web', 'ios', 'android'],
    default: 'web',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
