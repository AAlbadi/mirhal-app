const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Define Vehicle Schema (simplified)
const vehicleSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: String,
  make: String,
  model: String,
  year: Number,
  pricePerDay: Number,
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  sleeps: Number,
  features: [String],
  images: [String],
  owner: String,
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

// Create test vehicle
async function addTestVehicle() {
  try {
    const testVehicle = new Vehicle({
      title: 'TEST: Luxury Desert Explorer RV',
      description: 'Experience the desert in ultimate comfort. This fully-equipped RV has everything you need for a memorable adventure, from a powerful AC to a stargazing sunroof. **THIS IS A TEST VEHICLE FOR BOOKING SYSTEM**',
      type: 'RV',
      make: 'Mercedes',
      model: 'Sprinter',
      year: 2023,
      pricePerDay: 850,
      location: {
        address: 'Dubai Mall',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        coordinates: {
          lat: 25.2048,
          lng: 55.2708
        }
      },
      sleeps: 4,
      features: [
        'Air Conditioning',
        'Shower',
        'Full Kitchen',
        'Solar Panels',
        'WiFi',
        'Backup Camera',
        'Heating'
      ],
      images: [
        'https://picsum.photos/seed/test-rv-1/1024/768',
        'https://picsum.photos/seed/test-rv-2/1024/768',
        'https://picsum.photos/seed/test-rv-3/1024/768'
      ],
      owner: 'test-user-id', // This should be a real user ID in production
      available: true
    });

    const savedVehicle = await testVehicle.save();

    console.log('\n🎉 TEST VEHICLE CREATED SUCCESSFULLY!\n');
    console.log('📋 Vehicle Details:');
    console.log('  ID:', savedVehicle._id);
    console.log('  Title:', savedVehicle.title);
    console.log('  Price:', `AED ${savedVehicle.pricePerDay}/day`);
    console.log('  Location:', savedVehicle.location.city);
    console.log('\n🔗 Access URL:');
    console.log(`  http://localhost:3000/vehicle/${savedVehicle._id}`);
    console.log('\n✅ You can now use this vehicle to test the booking system with Stripe payments!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test vehicle:', error);
    process.exit(1);
  }
}

addTestVehicle();
