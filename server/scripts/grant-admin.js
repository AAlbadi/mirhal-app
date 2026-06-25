const mongoose = require('mongoose');
require('dotenv').config();

async function grantAdminAccess() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/droobee-marketplace';
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const User = require('../models/User');

        const email = 'abdulazizalbadi91@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log(`📧 Found user: ${user.email}`);
            console.log(`   Current admin status: ${user.isAdmin}`);
            console.log(`   Current role: ${user.role}`);

            user.isAdmin = true;
            user.role = 'admin';
            await user.save();

            console.log('✅ Admin access granted!');
            console.log(`   New admin status: ${user.isAdmin}`);
            console.log(`   New role: ${user.role}`);
        } else {
            console.log(`❌ User with email ${email} not found`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

grantAdminAccess();
