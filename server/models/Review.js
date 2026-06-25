const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
  },
  reviewType: {
    type: String,
    enum: ['vehicle', 'renter', 'host'],
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  cleanliness: {
    type: Number,
    min: 1,
    max: 5,
  },
  communication: {
    type: Number,
    min: 1,
    max: 5,
  },
  accuracy: {
    type: Number,
    min: 1,
    max: 5,
  },
  value: {
    type: Number,
    min: 1,
    max: 5,
  },
  terrainSuggestion: {
    type: String,
    maxlength: 100,
  },
  comment: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  response: {
    type: String,
    maxlength: 1000,
  },
  respondedAt: {
    type: Date,
  },
  isPublic: {
    type: Boolean,
    default: true, // Visible by default (Post First, Moderate Later)
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
  },
  selectedAmenities: [{
    type: String,
    enum: [
      'restroom', 'parking', 'firepit', 'water', 'shade', 'wifi', 'electric', 'picnic', 'trails', 'showers', 'swimming', 'fishing', 'petfriendly', 'accessible', 'trash', 'security',
      'prayer', 'bbq', '4x4', 'tent_rental', 'family', 'fenced', 'camels', 'dunes'
    ]
  }],
  photos: {
    type: [String], // URLs
    validate: {
      validator: function (v) {
        return v.length <= 6;
      },
      message: 'Maximum 6 photos allowed per review'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Indexes for faster queries
reviewSchema.index({ vehicleId: 1, isPublic: 1 });
reviewSchema.index({ revieweeId: 1, reviewType: 1 });
reviewSchema.index({ bookingId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
