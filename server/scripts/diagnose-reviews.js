const mongoose = require('mongoose');
const Review = require('../models/Review');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mirhal-marketplace';

async function diagnose() {
    try {
        console.log('🔌 Connecting to DB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        // 1. Check Specific ID from User Screenshot
        const specificId = '6957a86a264b9aa6275e1c7c'; // Visible in screenshot
        console.log(`\n🔍 Checking User's Reference ID: ${specificId}`);
        // ID in screenshot looks like it might be mock data or short? 
        // Actually 6957a86a264b9aa6275e1c7c is 24 hex chars? 
        // "6957a86a264b9aa6275e1c7c" -> length 24. It is valid ObjectId format.

        let exists = null;
        try {
            exists = await Review.findById(specificId);
        } catch (e) {
            console.log('   ❌ ID format invalid/error');
        }

        if (exists) {
            console.log('   ✅ ID Found in DB!');
            console.log('   Stats: ', exists.approvalStatus);
        } else {
            console.log('   ❌ ID NOT FOUND in DB. (This explains why Sync fails - Sheet has old data)');
        }

        // 2. Check for Orphans (Reviews with missing Spot)
        console.log('\n👻 Checking for Orphan Reviews (Missing Spot)...');
        const reviews = await Review.find().populate('vehicleId');
        const orphans = reviews.filter(r => !r.vehicleId);

        console.log(`   Total Reviews: ${reviews.length}`);
        console.log(`   Orphan Reviews: ${orphans.length}`);

        if (orphans.length > 0) {
            console.log('   ⚠️ FOUND ORPHANS! These reviews point to spots that don\'t exist.');
            console.log('   Sample Orphan:', orphans[0]._id, '-> vehicleId:', orphans[0].vehicleId);
            // This explains why "Spot ID" is empty in the sheet export.
        } else {
            console.log('   ✅ All reviews have valid spots.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
