require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

const testVehicles = [
  {
    title: 'Luxury Class A Motorhome - Perfect for Families',
    description: 'Experience the ultimate in RV luxury with this spacious Class A motorhome. Features a full kitchen, bathroom, bedroom, and living area. Perfect for family adventures across the UAE.',
    type: 'Class A',
    year: 2023,
    make: 'Winnebago',
    model: 'Vista',
    length: 35,
    sleeps: 6,
    price: 450,
    location: {
      address: 'Dubai Marina',
      city: 'Dubai',
      state: 'Dubai',
      country: 'United Arab Emirates',
      zipCode: '',
      formattedAddress: 'Dubai Marina, Dubai, United Arab Emirates',
      coordinates: {
        lat: 25.0805,
        lng: 55.1396
      }
    },
    images: [
      'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800',
      'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800',
      'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800'
    ],
    amenities: ['WiFi', 'Full Kitchen', 'Bathroom', 'Air Conditioning', 'Solar Panels', 'Generator', 'TV'],
    rules: 'No smoking, No pets, Return with full fuel tank, Maximum 6 guests',
    approvalStatus: 'approved',
    isActive: true,
  },
  {
    title: 'Compact Mercedes Sprinter Van - 2024',
    description: 'Modern and fuel-efficient camper van perfect for couples. Features a cozy bed, kitchenette, and all the essentials for an amazing road trip.',
    type: 'Camper Van',
    year: 2024,
    make: 'Mercedes-Benz',
    model: 'Sprinter',
    length: 20,
    sleeps: 2,
    price: 180,
    location: {
      address: 'Abu Dhabi Corniche',
      city: 'Abu Dhabi',
      state: 'Abu Dhabi',
      country: 'United Arab Emirates',
      zipCode: '',
      formattedAddress: 'Abu Dhabi Corniche, Abu Dhabi, United Arab Emirates',
      coordinates: {
        lat: 24.4539,
        lng: 54.3773
      }
    },
    images: [
      'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'
    ],
    amenities: ['WiFi', 'Kitchenette', 'Solar Power', 'Heating', 'Cooling'],
    rules: 'No smoking, Small pets allowed with deposit, Return clean',
    approvalStatus: 'approved',
    isActive: true,
  },
  {
    title: 'Lightweight Airstream Travel Trailer - 2023',
    description: 'Iconic Airstream trailer with modern amenities. Lightweight and easy to tow, perfect for exploring the desert and mountains.',
    type: 'Travel Trailer',
    year: 2023,
    make: 'Airstream',
    model: 'Flying Cloud',
    length: 25,
    sleeps: 4,
    price: 120,
    location: {
      address: 'Sharjah',
      city: 'Sharjah',
      state: 'Sharjah',
      country: 'United Arab Emirates',
      zipCode: '',
      formattedAddress: 'Sharjah, United Arab Emirates',
      coordinates: {
        lat: 25.3463,
        lng: 55.4209
      }
    },
    images: [
      'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800',
      'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800'
    ],
    amenities: ['Full Kitchen', 'Bathroom', 'Air Conditioning', 'WiFi'],
    rules: 'No smoking, No pets',
    approvalStatus: 'approved',
    isActive: true,
  }
];

async function addTestVehicles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get first user (will be the host)
    let host = await User.findOne();

    if (!host) {
      console.log('⚠️  No users found. Creating a test host...');
      host = new User({
        firebaseUid: 'test-host-uid',
        email: 'testhost@mirhal.com',
        name: 'Test Host',
        role: 'host',
        isAdmin: false,
        hostProfile: {
          status: 'approved',
          bio: 'Experienced RV host',
          phone: '+971501234567'
        }
      });
      await host.save();
      console.log('✅ Test host created\n');
    }

    console.log(`👤 Using host: ${host.name} (${host.email})\n`);

    // Add vehicles
    for (const vehicleData of testVehicles) {
      const vehicle = new Vehicle({
        ...vehicleData,
        hostId: host._id,
        approvedBy: host._id,
        approvedAt: new Date(),
      });
      await vehicle.save();
      console.log(`✅ Added: ${vehicle.title}`);
    }

    console.log(`\n🎉 Successfully added ${testVehicles.length} test vehicles!`);
    console.log('📍 You can now see them on the homepage\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

addTestVehicles();
