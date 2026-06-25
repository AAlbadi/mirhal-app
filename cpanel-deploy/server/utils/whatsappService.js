const twilio = require('twilio');

// Initialize Twilio client
let twilioClient = null;

const initializeTwilio = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.log('⚠️  Twilio credentials not configured - WhatsApp notifications disabled');
    return null;
  }

  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ Twilio WhatsApp service initialized');
    return twilioClient;
  } catch (error) {
    console.error('❌ Failed to initialize Twilio:', error.message);
    return null;
  }
};

// Initialize on module load
initializeTwilio();

/**
 * Send WhatsApp message using Twilio
 * @param {string} to - Recipient phone number (E.164 format: +971501234567)
 * @param {string} message - Message content
 */
const sendWhatsAppMessage = async (to, message) => {
  try {
    // Skip if Twilio not configured
    if (!twilioClient) {
      console.log('📱 WhatsApp message (not sent - Twilio not configured):');
      console.log(`   To: ${to}`);
      console.log(`   Message: ${message}`);
      return { success: false, reason: 'Twilio not configured' };
    }

    // Validate phone number format
    if (!to || !to.startsWith('+')) {
      console.error('❌ Invalid phone number format. Must be E.164 format (+971501234567)');
      return { success: false, reason: 'Invalid phone number format' };
    }

    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio Sandbox number

    const response = await twilioClient.messages.create({
      from: fromNumber,
      to: `whatsapp:${to}`,
      body: message,
    });

    console.log('✅ WhatsApp message sent:', response.sid);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error('❌ Failed to send WhatsApp message:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send WhatsApp notification when new host requests to join
 */
const sendNewHostRequestToAdmin = async (host) => {
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
  if (!adminPhone) {
    console.log('⚠️  Admin WhatsApp number not configured');
    return;
  }

  const message = `🔔 *New Host Request / طلب مضيف جديد*\n\n` +
    `*English:*\n` +
    `Name: ${host.name}\n` +
    `Email: ${host.email}\n` +
    `Phone: ${host.hostProfile?.phone || 'N/A'}\n` +
    `City: ${host.hostProfile?.address?.city || 'N/A'}\n\n` +
    `*عربي:*\n` +
    `الاسم: ${host.name}\n` +
    `البريد: ${host.email}\n` +
    `الهاتف: ${host.hostProfile?.phone || 'غير متوفر'}\n` +
    `المدينة: ${host.hostProfile?.address?.city || 'غير متوفر'}\n\n` +
    `Review at / راجع: ${process.env.FRONTEND_URL}/admin/dashboard`;

  await sendWhatsAppMessage(adminPhone, message);
};

/**
 * Send WhatsApp notification when admin approves host
 */
const sendHostApprovalWhatsApp = async (host) => {
  const hostPhone = host.hostProfile?.phone;
  if (!hostPhone) {
    console.log('⚠️  Host phone number not available');
    return;
  }

  const adminWhatsApp = process.env.ADMIN_WHATSAPP_NUMBER || '+971566300939';

  const message = `🎉 *Congratulations! / مبروك!*\n\n` +
    `${host.name}, your DROOBEE host application has been APPROVED!\n` +
    `${host.name}، تمت الموافقة على طلب المضيف الخاص بك في دروبي!\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `*English:*\n` +
    `To list your vehicles, please send us via WhatsApp:\n\n` +
    `✅ Vehicle photos (exterior, interior, dashboard)\n` +
    `✅ Vehicle details (make, model, year, capacity)\n` +
    `✅ Daily rental price (AED)\n` +
    `✅ Availability dates\n` +
    `✅ Vehicle location\n` +
    `✅ Special features\n\n` +
    `*عربي:*\n` +
    `لإدراج مركباتك، يرجى إرسال:\n\n` +
    `✅ صور المركبة (خارجية، داخلية، لوحة القيادة)\n` +
    `✅ تفاصيل المركبة (العلامة، الطراز، السنة، السعة)\n` +
    `✅ سعر الإيجار اليومي (درهم)\n` +
    `✅ تواريخ التوفر\n` +
    `✅ موقع المركبة\n` +
    `✅ ميزات خاصة\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📱 Send to / أرسل إلى: ${adminWhatsApp}\n\n` +
    `Welcome to DROOBEE! / مرحباً بك في دروبي!`;

  await sendWhatsAppMessage(hostPhone, message);
};

/**
 * Send WhatsApp notification when booking is approved by admin
 */
const sendBookingApprovedToGuest = async (booking, guest) => {
  const guestPhone = guest.phone || booking.guestDetails?.phone;
  if (!guestPhone) {
    console.log('⚠️  Guest phone number not available');
    return;
  }

  const checkIn = new Date(booking.startDate).toLocaleDateString();
  const checkOut = new Date(booking.endDate).toLocaleDateString();

  const message = `✅ *Booking Approved! / تم تأكيد الحجز!*\n\n` +
    `*English:*\n` +
    `Your booking has been approved by our team.\n\n` +
    `Vehicle: ${booking.vehicleId?.title || 'N/A'}\n` +
    `Check-in: ${checkIn}\n` +
    `Check-out: ${checkOut}\n` +
    `Total: AED ${booking.finalTotal}\n\n` +
    `The host will contact you soon with pickup details.\n\n` +
    `*عربي:*\n` +
    `تم الموافقة على حجزك من قبل فريقنا.\n\n` +
    `المركبة: ${booking.vehicleId?.title || 'غير متوفر'}\n` +
    `الدخول: ${checkIn}\n` +
    `الخروج: ${checkOut}\n` +
    `الإجمالي: ${booking.finalTotal} درهم\n\n` +
    `سيتواصل معك المضيف قريباً بتفاصيل الاستلام.\n\n` +
    `View booking / شاهد الحجز: ${process.env.FRONTEND_URL}/my-bookings`;

  await sendWhatsAppMessage(guestPhone, message);
};

/**
 * Send WhatsApp notification to host about new booking
 */
const sendNewBookingToHost = async (booking, host, vehicle) => {
  const hostPhone = host.hostProfile?.phone;
  if (!hostPhone) {
    console.log('⚠️  Host phone number not available');
    return;
  }

  const checkIn = new Date(booking.startDate).toLocaleDateString();
  const checkOut = new Date(booking.endDate).toLocaleDateString();

  const message = `🚐 *New Booking Request / طلب حجز جديد*\n\n` +
    `*English:*\n` +
    `Vehicle: ${vehicle.title}\n` +
    `Guest: ${booking.renterId?.name || booking.guestDetails?.name}\n` +
    `Check-in: ${checkIn}\n` +
    `Check-out: ${checkOut}\n` +
    `Total: AED ${booking.finalTotal}\n\n` +
    `*عربي:*\n` +
    `المركبة: ${vehicle.title}\n` +
    `الضيف: ${booking.renterId?.name || booking.guestDetails?.name}\n` +
    `الدخول: ${checkIn}\n` +
    `الخروج: ${checkOut}\n` +
    `الإجمالي: ${booking.finalTotal} درهم\n\n` +
    `Review at / راجع: ${process.env.FRONTEND_URL}/host/dashboard`;

  await sendWhatsAppMessage(hostPhone, message);
};

module.exports = {
  sendWhatsAppMessage,
  sendNewHostRequestToAdmin,
  sendHostApprovalWhatsApp,
  sendBookingApprovedToGuest,
  sendNewBookingToHost,
};
