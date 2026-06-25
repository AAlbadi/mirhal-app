/**
 * Delete All Reviews Script
 * 
 * This script deletes all reviews from the database to start fresh.
 * New reviews will be properly tied to spots via spotId.
 */

const mongoose = require('mongoose');
const Review = require('../models/Review');

async function deleteAllReviews() {
    try {
        console.log('🗑️  Starting review deletion...\n');

        const count = await Review.countDocuments();
        console.log(`📊 Total reviews in database: ${count}`);

        if (count === 0) {
            console.log('✅ No reviews to delete!');
            return { deleted: 0 };
        }

        const result = await Review.deleteMany({});

        console.log(`\n✅ Deletion complete!`);
        console.log(`   Deleted: ${result.deletedCount} reviews`);

        const remaining = await Review.countDocuments();
        console.log(`   Remaining: ${remaining} reviews`);

        return { deleted: result.deletedCount };

    } catch (error) {
        console.error('❌ Deletion error:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    require('dotenv').config();

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/droobee-marketplace';
    console.log(`🔌 Connecting to: ${uri}\n`);

    mongoose.connect(uri)
        .then(() => {
            console.log('✅ Connected to MongoDB');
            console.log(`   Database: ${mongoose.connection.db.databaseName}\n`);
            return deleteAllReviews();
        })
        .then((result) => {
            console.log(`\n✅ Script complete - ${result.deleted} reviews deleted`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { deleteAllReviews };
