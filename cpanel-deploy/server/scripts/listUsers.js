require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function listUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users
    const users = await User.find({}).select('name email isAdmin firebaseUid');

    console.log(`📋 Found ${users.length} users:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔐 Admin: ${user.isAdmin ? 'YES ✅' : 'NO'}`);
      console.log(`   🆔 Firebase UID: ${user.firebaseUid || 'N/A'}`);
      console.log('');
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

listUsers();
