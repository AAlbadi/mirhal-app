const mongoose = require('mongoose');
require('dotenv').config();

async function dropFirebaseIndex() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/droobee-marketplace';
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Get all indexes
        const indexes = await usersCollection.indexes();
        console.log('📋 Current indexes:', indexes.map(i => i.name));

        // Drop the firebaseUid index if it exists
        try {
            await usersCollection.dropIndex('firebaseUid_1');
            console.log('✅ Successfully dropped firebaseUid_1 index');
        } catch (err) {
            if (err.code === 27) {
                console.log('ℹ️ firebaseUid_1 index does not exist, nothing to drop');
            } else {
                throw err;
            }
        }

        // Also check for and remove any users with null firebaseUid
        const User = require('../models/User');
        const usersWithNullFirebase = await User.find({ firebaseUid: null });
        console.log(`ℹ️ Found ${usersWithNullFirebase.length} users with null firebaseUid`);

        await mongoose.connection.close();
        console.log('✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

dropFirebaseIndex();
