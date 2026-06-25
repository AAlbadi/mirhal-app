const emailService = require('./services/emailService');

// Test data for booking confirmation emails (triggered after payment)
const testBookingData = {
  guestName: 'John Doe',
  guestEmail: 'john.doe@example.com',
  guestPhone: '+1234567890',
  numberOfGuests: 4,
  startDate: new Date('2025-12-20'),
  endDate: new Date('2025-12-27'),
  totalPrice: 700.00,
  serviceFee: 70.00,
  finalTotal: 770.00,
  vehicle: {
    title: '2023 Winnebago Travato'
  },
  host: {
    name: 'Jane Smith',
    email: 'jane.smith@example.com'
  }
};

// Test data for refund confirmation
const testRefundData = {
  guestName: 'John Doe',
  guestEmail: 'john.doe@example.com',
  startDate: new Date('2025-12-20'),
  endDate: new Date('2025-12-27'),
  finalTotal: 770.00,
  vehicle: {
    title: '2023 Winnebago Travato'
  }
};

async function testEmails() {
  console.log('\n🧪 TESTING STRIPE EMAIL FUNCTIONS\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Test 1: Booking Confirmation to Renter (after payment succeeds)
    console.log('📧 Test 1: Sending booking confirmation to renter...\n');
    await emailService.sendBookingConfirmationToRenter(testBookingData);

    console.log('\n───────────────────────────────────────────────────────────\n');

    // Test 2: New Booking Notification to Host (after payment succeeds)
    console.log('📧 Test 2: Sending new booking notification to host...\n');
    await emailService.sendNewBookingNotificationToHost(testBookingData);

    console.log('\n───────────────────────────────────────────────────────────\n');

    // Test 3: Refund Confirmation (after charge is refunded)
    console.log('📧 Test 3: Sending refund confirmation...\n');
    await emailService.sendRefundConfirmation(testRefundData);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n✅ All email tests completed!\n');

  } catch (error) {
    console.error('❌ Error testing emails:', error);
  }

  process.exit(0);
}

testEmails();
