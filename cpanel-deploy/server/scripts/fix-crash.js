const mongoose = require('mongoose');
require('dotenv').config();

async function fixCrash() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            // Try default if env missing
            console.warn('⚠️ MONGODB_URI not found in env, using default localhost');
        }
        const connectionUri = uri || 'mongodb://localhost:27017/droobee-marketplace';

        await mongoose.connect(connectionUri);
        console.log('✅ Connected to MongoDB for fix');

        const User = require('../models/User'); // Adjust path based on where we run this

        const email = 'abdulazizalbadi91@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log(`⚠️ Found existing user with email ${email}. Deleting to prevent startup crash...`);
            await User.deleteOne({ _id: user._id });
            console.log('✅ User deleted successfully.');
        } else {
            console.log(`ℹ️ User with email ${email} not found. Safe to start.`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error executing fix:', error);
        process.exit(1);
    }
}

fixCrash();
