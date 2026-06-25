const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { checkJwt, attachUser } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Create a review
router.post(
  '/',
  checkJwt,
  attachUser,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').trim().notEmpty().withMessage('Comment is required'),
    body('vehicleId').optional().isMongoId(),
    body('bookingId').optional().isMongoId(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        bookingId,
        vehicleId,
        rating,
        comment,
        cleanliness,
        communication,
        accuracy,
        value,
        terrainSuggestion,
        photos,
        selectedAmenities,
      } = req.body;

      let reviewData = {
        reviewerId: req.user._id,
        rating,
        comment,
        cleanliness,
        communication,
        accuracy,
        value,
        terrainSuggestion,
        photos: photos || [],
        selectedAmenities: selectedAmenities || [],
        isPublic: true, // "Post First, Moderate Later" - Visible immediately
        approvalStatus: 'pending',
      };

      if (bookingId) {
        // Linked to Booking
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.status !== 'completed') return res.status(400).json({ error: 'Can only review completed bookings' });

        const isRenter = booking.renterId.toString() === req.user._id.toString();
        const isHost = booking.hostId.toString() === req.user._id.toString();
        if (!isRenter && !isHost) return res.status(403).json({ error: 'Access denied' });

        const existingReview = await Review.findOne({ bookingId, reviewerId: req.user._id });
        if (existingReview) return res.status(400).json({ error: 'You have already reviewed this booking' });

        reviewData.bookingId = bookingId;
        reviewData.revieweeId = isRenter ? booking.hostId : booking.renterId;
        if (isRenter) {
          reviewData.reviewType = 'vehicle';
          reviewData.vehicleId = booking.vehicleId;
        } else {
          reviewData.reviewType = 'renter';
        }
      } else if (vehicleId) {
        // Direct Review (Spot)
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) return res.status(404).json({ error: 'Spot not found' });

        // Check for existing review by this user for this spot
        const existingReview = await Review.findOne({ vehicleId, reviewerId: req.user._id, bookingId: null });
        if (existingReview) {
          // Return existing review for editing instead of blocking
          return res.status(200).json({
            message: 'You have already reviewed this spot',
            existingReview,
            canEdit: true
          });
        }

        reviewData.reviewType = 'vehicle';
        reviewData.vehicleId = vehicleId;
        // Check if vehicle has a host (might be anonymous)
        if (vehicle.hostId) {
          reviewData.revieweeId = vehicle.hostId;
        }
      } else {
        return res.status(400).json({ error: 'Must provide bookingId or vehicleId' });
      }

      const review = new Review(reviewData);
      await review.save();

      if (bookingId) {
        const booking = await Booking.findById(bookingId);
        if (booking) {
          if (booking.renterId.toString() === req.user._id.toString()) booking.reviewByRenter = review._id;
          else booking.reviewByHost = review._id;
          await booking.save();
        }
      }

      await review.populate(['reviewerId', 'revieweeId', 'vehicleId']);

      res.status(201).json({
        message: 'Review submitted for approval',
        review,
      });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({
        error: 'Failed to create review',
        message: error.message,
        details: error.errors
      });
    }
  }
);

// Get reviews for a vehicle
router.get('/vehicle/:vehicleId', async (req, res) => {
  try {
    const reviews = await Review.find({
      vehicleId: req.params.vehicleId,
      reviewType: 'vehicle',
      isPublic: true,
    })
      .populate('reviewerId', 'name picture')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    console.error('Get vehicle reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get reviews for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { reviewType } = req.query;
    const query = {
      revieweeId: req.params.userId,
      isPublic: true,
    };

    if (reviewType) {
      query.reviewType = reviewType;
    }

    const reviews = await Review.find(query)
      .populate('reviewerId', 'name picture')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Update an existing review
router.put('/:id', checkJwt, attachUser, async (req, res) => {
  try {
    const {
      rating,
      comment,
      cleanliness,
      communication,
      accuracy,
      value,
      terrainSuggestion,
      photos,
      selectedAmenities,
    } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user owns this review
    if (review.reviewerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }

    // Update fields
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.cleanliness = cleanliness !== undefined ? cleanliness : review.cleanliness;
    review.communication = communication !== undefined ? communication : review.communication;
    review.accuracy = accuracy !== undefined ? accuracy : review.accuracy;
    review.value = value !== undefined ? value : review.value;
    review.terrainSuggestion = terrainSuggestion !== undefined ? terrainSuggestion : review.terrainSuggestion;
    review.photos = photos || review.photos;
    review.selectedAmenities = selectedAmenities || review.selectedAmenities;

    // Reset to pending if it was previously approved (requires re-moderation)
    if (review.approvalStatus === 'approved') {
      review.approvalStatus = 'pending';
      review.isPublic = false;
    }

    await review.save();
    await review.populate(['reviewerId', 'revieweeId', 'vehicleId']);

    res.json({
      message: 'Review updated successfully and submitted for re-approval',
      review,
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Respond to a review
router.put('/:id/respond', checkJwt, attachUser, async (req, res) => {
  try {
    const { response } = req.body;

    if (!response || response.trim().length === 0) {
      return res.status(400).json({ error: 'Response text is required' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user is the reviewee
    if (review.revieweeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only respond to reviews about you' });
    }

    if (review.response) {
      return res.status(400).json({ error: 'You have already responded to this review' });
    }

    review.response = response.trim();
    review.respondedAt = new Date();
    await review.save();

    await review.populate(['reviewerId', 'revieweeId', 'vehicleId']);

    res.json({
      message: 'Response added successfully',
      review,
    });
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({ error: 'Failed to respond to review' });
  }
});

// Helper function to update vehicle rating
async function updateVehicleRating(vehicleId) {
  try {
    const reviews = await Review.find({
      vehicleId,
      reviewType: 'vehicle',
      isPublic: true,
      approvalStatus: 'approved' // Ensure only approved reviews count
    });

    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Vehicle.findByIdAndUpdate(vehicleId, {
      'rating.average': Math.round(averageRating * 10) / 10,
      'rating.count': reviews.length,
    });
  } catch (error) {
    console.error('Update vehicle rating error:', error);
  }
}

module.exports = { router, updateVehicleRating };
