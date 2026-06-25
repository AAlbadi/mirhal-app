require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Get email from command line argument
const emailToMakeAdmin = process.argv[2];

if (!emailToMakeAdmin) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/makeAdmin.js <email@example.com>');
  process.exit(1);
}

async function makeUserAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: emailToMakeAdmin });

    if (!user) {
      console.error(`❌ User with email "${emailToMakeAdmin}" not found`);
      process.exit(1);
    }

    // Update user to admin
    user.isAdmin = true;
    await user.save();

    console.log('✅ User updated successfully!');
    console.log('👤 Name:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🔐 Admin Status:', user.isAdmin ? 'YES' : 'NO');
    console.log('\n🎉 You can now access the admin dashboard!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

makeUserAdmin();
