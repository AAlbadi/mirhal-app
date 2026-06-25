const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for anonymous submissions
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  titleAr: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  descriptionAr: {
    type: String,
  },
  type: {
    type: String,
    required: true,
  },
  emoji: {
    type: String,
    default: '🐪',
  },
  spotId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values while maintaining uniqueness for non-null
    index: true,
  },
  managedBy: {
    type: String,
    default: 'manual',
  },
  year: {
    type: Number,
    required: true,
  },
  make: {
    type: String,
    required: false, // Optional for camping spots
  },
  model: {
    type: String,
    required: false, // Optional for camping spots
  },
  length: {
    type: Number, // in feet
    required: false, // Optional for camping spots
  },
  sleeps: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  contactPhone: {
    type: String, // Required only for Paid Camping
    required: false,
  },
  location: {
    address: {
      type: String,
      required: false, // Optional - use formattedAddress
    },
    addressAr: {
      type: String,
    },
    city: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    zipCode: {
      type: String,
    },
    formattedAddress: {
      type: String,
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    locationLink: {
      type: String,
      trim: true,
    },
  },
  images: [{
    type: String, // URLs
  }],
  amenities: [{
    type: String,
  }],
  rules: {
    type: String,
  },
  availability: {
    type: Map,
    of: Boolean, // dates as keys, true/false for availability
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  // Duplicates removed
  rating: {
    average: {
      type: Number,
      default: 0,
    },
    count: {
      type: Number,
      default: 0,
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
}, { timestamps: true });

// Pre-save hook to auto-generate spotId
vehicleSchema.pre('save', async function (next) {
  if (!this.spotId && this.isNew) {
    try {
      // Find the latest vehicle with a valid spotId
      const latestVehicle = await mongoose.model('Vehicle')
        .findOne({ spotId: { $regex: /^SPOT-\d+$/ } })
        .sort({ spotId: -1 })
        .select('spotId');

      let nextNum = 1;
      if (latestVehicle && latestVehicle.spotId) {
        const parts = latestVehicle.spotId.split('-');
        const lastNum = parseInt(parts[1], 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }

      this.spotId = `SPOT-${String(nextNum).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating spotId:', error);
      // Fallback unique ID using timestamp if completely failed
      this.spotId = `SPOT-${Date.now()}`;
    }
  }
  next();
});

// Indexes for faster queries
vehicleSchema.index({ hostId: 1 });
vehicleSchema.index({ type: 1 });
vehicleSchema.index({ 'location.city': 1 });
vehicleSchema.index({ 'location.state': 1 });
vehicleSchema.index({ 'location.country': 1 });
vehicleSchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial index for location-based queries
vehicleSchema.index({ price: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
