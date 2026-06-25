const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

async function setupTestData() {
  try {
    console.log('\n🚀 Setting up test data for booking system...\n');

    // Step 1: Create a test host user
    console.log('👤 Creating test host user...');
    let hostUser = await User.findOne({ email: 'testhost@mirhal.com' });

    if (hostUser) {
      console.log('ℹ️  Test host user already exists:', hostUser._id);
    } else {
      hostUser = new User({
        firebaseUid: 'test-firebase-host-uid-12345',
        email: 'testhost@mirhal.com',
        name: 'Test Host User',
        role: 'host',
        emailVerified: true,
        hostProfile: {
          isApproved: true,
          approvalStatus: 'approved',
          bio: 'Professional RV host with years of experience',
          phone: '+971 50 123 4567',
        },
      });
      await hostUser.save();
      console.log('✅ Test host user created:', hostUser._id);
    }

    // Step 2: Delete old test vehicles
    console.log('\n🗑️  Cleaning up old test vehicles...');
    await Vehicle.deleteMany({ title: /^TEST:/ });

    // Step 3: Create a test vehicle
    console.log('\n🚐 Creating test vehicle...');
    const testVehicle = new Vehicle({
      hostId: hostUser._id, // Use the MongoDB ObjectId of the host
      title: 'TEST: Luxury Desert Explorer RV',
      description: 'Experience the desert in ultimate comfort. This fully-equipped RV has everything you need for a memorable adventure, from a powerful AC to a stargazing sunroof. **THIS IS A TEST VEHICLE FOR BOOKING SYSTEM**',
      type: 'Class B',
      make: 'Mercedes',
      model: 'Sprinter',
      year: 2023,
      length: 24,
      sleeps: 4,
      price: 850,
      location: {
        address: 'Dubai Mall',
        city: 'Dubai',
        state: 'Dubai',
        country: 'United Arab Emirates',
        zipCode: '00000',
        coordinates: {
          lat: 25.2048,
          lng: 55.2708
        }
      },
      images: [
        'https://picsum.photos/seed/test-rv-1/1024/768',
        'https://picsum.photos/seed/test-rv-2/1024/768',
        'https://picsum.photos/seed/test-rv-3/1024/768'
      ],
      amenities: [
        'Air Conditioning',
        'Shower',
        'Full Kitchen',
        'Solar Panels',
        'WiFi',
        'Backup Camera',
        'Heating'
      ],
      isActive: true,
    });

    const savedVehicle = await testVehicle.save();

    console.log('\n🎉 TEST DATA SETUP COMPLETE!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 Host User Details:');
    console.log('  MongoDB ID:', hostUser._id.toString());
    console.log('  Firebase UID:', hostUser.firebaseUid);
    console.log('  Email:', hostUser.email);
    console.log('  Name:', hostUser.name);
    console.log('  Role:', hostUser.role);
    console.log('\n📋 Vehicle Details:');
    console.log('  MongoDB ID:', savedVehicle._id.toString());
    console.log('  Title:', savedVehicle.title);
    console.log('  Price: AED', savedVehicle.price, '/day');
    console.log('  Location:', savedVehicle.location.city);
    console.log('  Host ID:', savedVehicle.hostId.toString());
    console.log('\n🔗 Test URLs:');
    console.log('  Vehicle Page: http://localhost:3000/vehicle/' + savedVehicle._id);
    console.log('\n💡 Usage:');
    console.log('  1. Sign in with Firebase authentication');
    console.log('  2. Visit the vehicle page URL above');
    console.log('  3. Click "Reserve Now" and complete booking');
    console.log('  4. Use Stripe test card: 4242 4242 4242 4242');
    console.log('\n✅ The system will automatically:');
    console.log('  - Create a MongoDB User for you (Firebase → MongoDB sync)');
    console.log('  - Process payment through Stripe');
    console.log('  - Create a booking with proper ObjectId references');
    console.log('═══════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

setupTestData();
