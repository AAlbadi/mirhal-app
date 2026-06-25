/**
 * Data Cleanup Script for Reviews
 * 
 * This script ensures:
 * 1. All reviews are properly tied to spot unique IDs (vehicleId)
 * 2. Removes duplicate reviews (keeps only one review per user per spot)
 * 3. Cleans up orphaned reviews (reviews for non-existent spots)
 */

const mongoose = require('mongoose');
const Review = require('./models/Review');
const Vehicle = require('./models/Vehicle');

async function cleanupReviews() {
    try {
        console.log('🧹 Starting review cleanup...');

        // 1. Find all reviews
        const allReviews = await Review.find({});
        console.log(`📊 Total reviews found: ${allReviews.length}`);

        // 2. Find orphaned reviews (reviews for non-existent vehicles)
        const orphanedReviews = [];
        for (const review of allReviews) {
            if (review.vehicleId) {
                const vehicle = await Vehicle.findById(review.vehicleId);
                if (!vehicle) {
                    orphanedReviews.push(review._id);
                }
            } else {
                orphanedReviews.push(review._id);
            }
        }

        if (orphanedReviews.length > 0) {
            await Review.deleteMany({ _id: { $in: orphanedReviews } });
            console.log(`🗑️ Deleted ${orphanedReviews.length} orphaned reviews`);
        }

        // 3. Find and remove duplicate reviews (keep newest one per user-spot combination)
        const validReviews = await Review.find({ _id: { $nin: orphanedReviews } });
        const reviewMap = new Map();
        const duplicatesToDelete = [];

        for (const review of validReviews) {
            const key = `${review.reviewerId}-${review.vehicleId}`;

            if (reviewMap.has(key)) {
                const existing = reviewMap.get(key);
                // Keep the newer review
                if (new Date(review.createdAt) > new Date(existing.createdAt)) {
                    duplicatesToDelete.push(existing._id);
                    reviewMap.set(key, review);
                } else {
                    duplicatesToDelete.push(review._id);
                }
            } else {
                reviewMap.set(key, review);
            }
        }

        if (duplicatesToDelete.length > 0) {
            await Review.deleteMany({ _id: { $in: duplicatesToDelete } });
            console.log(`🗑️ Deleted ${duplicatesToDelete.length} duplicate reviews`);
        }

        // 4. Ensure all remaining reviews have proper vehicleId references
        const reviewsWithoutVehicleId = await Review.find({ vehicleId: { $exists: false } });
        if (reviewsWithoutVehicleId.length > 0) {
            console.log(`⚠️ Found ${reviewsWithoutVehicleId.length} reviews without vehicleId - these need manual review`);
        }

        // 5. Summary
        const finalCount = await Review.countDocuments();
        console.log(`✅ Cleanup complete!`);
        console.log(`📊 Final review count: ${finalCount}`);
        console.log(`🗑️ Total deletions: ${orphanedReviews.length + duplicatesToDelete.length}`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}

// Run if called directly
if (require.main === module) {
    require('dotenv').config();

    mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mirhal-marketplace')
        .then(() => {
            console.log('✅ Connected to MongoDB');
            return cleanupReviews();
        })
        .then(() => {
            console.log('✅ Script complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { cleanupReviews };
