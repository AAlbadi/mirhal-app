require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');

async function listVehicles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all vehicles
    const vehicles = await Vehicle.find({}).select('title type approvalStatus isActive location');

    console.log(`📋 Found ${vehicles.length} vehicles:\n`);

    vehicles.forEach((vehicle, index) => {
      console.log(`${index + 1}. ${vehicle.title}`);
      console.log(`   Type: ${vehicle.type}`);
      console.log(`   Status: ${vehicle.approvalStatus}`);
      console.log(`   Active: ${vehicle.isActive ? 'YES' : 'NO'}`);
      console.log(`   Location: ${vehicle.location?.city || 'N/A'}, ${vehicle.location?.country || 'N/A'}`);
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

listVehicles();
