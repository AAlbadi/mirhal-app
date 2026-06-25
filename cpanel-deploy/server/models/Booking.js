const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  renterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  numberOfDays: {
    type: Number,
    required: true,
  },
  pricePerDay: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  serviceFee: {
    type: Number,
    required: true,
  },
  finalTotal: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'cancelled', 'completed'],
    default: 'pending',
  },
  adminApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminApprovedAt: {
    type: Date,
  },
  adminApprovedBy: {
    type: String,
  },
  adminRejectionReason: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending',
  },
  paymentIntentId: {
    type: String, // Stripe payment intent ID
  },
  guestDetails: {
    name: String,
    email: String,
    phone: String,
    numberOfGuests: Number,
  },
  specialRequests: {
    type: String,
  },
  cancellationReason: {
    type: String,
  },
  cancelledBy: {
    type: String,
    enum: ['renter', 'host', 'admin'],
  },
  cancelledAt: {
    type: Date,
  },
  reviewByRenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
  },
  reviewByHost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
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
bookingSchema.index({ vehicleId: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ renterId: 1, status: 1 });
bookingSchema.index({ hostId: 1, status: 1 });
bookingSchema.index({ status: 1, paymentStatus: 1 });
bookingSchema.index({ adminApprovalStatus: 1, createdAt: -1 });

// Method to check if dates overlap with existing bookings
bookingSchema.statics.checkAvailability = async function(vehicleId, startDate, endDate, excludeBookingId = null) {
  const query = {
    vehicleId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
    ],
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const overlappingBookings = await this.find(query);
  return overlappingBookings.length === 0;
};

module.exports = mongoose.model('Booking', bookingSchema);
