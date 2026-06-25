const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key from environment
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('⚠️ SENDGRID_API_KEY not configured - emails will not be sent');
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@droobee.com';

/**
 * Send booking confirmation email to renter
 */
const sendBookingConfirmationEmail = async (booking, renter, vehicle, host) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email not sent (SendGrid not configured): Booking confirmation');
    return;
  }

  const msg = {
    to: renter.email,
    from: FROM_EMAIL,
    subject: 'Booking Confirmation - DROOBEE',
    html: `
      <h2>Booking Confirmation</h2>
      <p>Hi ${renter.name},</p>
      <p>Your booking has been received and is awaiting host approval.</p>

      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Vehicle:</strong> ${vehicle.title}</li>
        <li><strong>Host:</strong> ${host.name}</li>
        <li><strong>Check-in:</strong> ${new Date(booking.startDate).toLocaleDateString()}</li>
        <li><strong>Check-out:</strong> ${new Date(booking.endDate).toLocaleDateString()}</li>
        <li><strong>Total:</strong> $${booking.finalTotal.toFixed(2)}</li>
      </ul>

      <p>You will receive another email once the host approves your booking.</p>

      <p>Best regards,<br>The DROOBEE Team</p>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`📧 Booking confirmation email sent to ${renter.email}`);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
  }
};

/**
 * Send booking approval email to renter
 */
const sendBookingApprovalEmail = async (booking, renter, vehicle, host) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email not sent (SendGrid not configured): Booking approval');
    return;
  }

  const msg = {
    to: renter.email,
    from: FROM_EMAIL,
    subject: 'Booking Approved - DROOBEE',
    html: `
      <h2>Your Booking Has Been Approved!</h2>
      <p>Hi ${renter.name},</p>
      <p>Great news! ${host.name} has approved your booking.</p>

      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Vehicle:</strong> ${vehicle.title}</li>
        <li><strong>Host:</strong> ${host.name}</li>
        <li><strong>Host Email:</strong> ${host.email}</li>
        <li><strong>Check-in:</strong> ${new Date(booking.startDate).toLocaleDateString()}</li>
        <li><strong>Check-out:</strong> ${new Date(booking.endDate).toLocaleDateString()}</li>
        <li><strong>Total Paid:</strong> $${booking.finalTotal.toFixed(2)}</li>
      </ul>

      <p>Please coordinate with your host for pickup details.</p>

      <p>Best regards,<br>The DROOBEE Team</p>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`📧 Booking approval email sent to ${renter.email}`);
  } catch (error) {
    console.error('Error sending booking approval email:', error);
  }
};

/**
 * Send booking declined email to renter
 */
const sendBookingDeclinedEmail = async (booking, renter, vehicle, reason) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email not sent (SendGrid not configured): Booking declined');
    return;
  }

  const msg = {
    to: renter.email,
    from: FROM_EMAIL,
    subject: 'Booking Update - DROOBEE',
    html: `
      <h2>Booking Update</h2>
      <p>Hi ${renter.name},</p>
      <p>Unfortunately, the host has declined your booking for ${vehicle.title}.</p>

      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}

      <p>A full refund of $${booking.finalTotal.toFixed(2)} has been processed to your original payment method.</p>

      <p>Please browse other available vehicles on DROOBEE.</p>

      <p>Best regards,<br>The DROOBEE Team</p>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`📧 Booking declined email sent to ${renter.email}`);
  } catch (error) {
    console.error('Error sending booking declined email:', error);
  }
};

/**
 * Send cancellation confirmation email to renter
 */
const sendCancellationEmail = async (booking, renter, vehicle) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email not sent (SendGrid not configured): Cancellation');
    return;
  }

  const msg = {
    to: renter.email,
    from: FROM_EMAIL,
    subject: 'Booking Cancelled - DROOBEE',
    html: `
      <h2>Booking Cancelled</h2>
      <p>Hi ${renter.name},</p>
      <p>Your booking for ${vehicle.title} has been cancelled.</p>

      <p>A full refund of $${booking.finalTotal.toFixed(2)} has been processed to your original payment method.</p>

      <p>We hope to see you again on DROOBEE!</p>

      <p>Best regards,<br>The DROOBEE Team</p>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`📧 Cancellation email sent to ${renter.email}`);
  } catch (error) {
    console.error('Error sending cancellation email:', error);
  }
};

/**
 * Send new booking notification to host
 */
const sendNewBookingNotificationToHost = async (booking, renter, vehicle, host) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email not sent (SendGrid not configured): New booking notification');
    return;
  }

  const msg = {
    to: host.email,
    from: FROM_EMAIL,
    subject: 'New Booking Request - DROOBEE',
    html: `
      <h2>New Booking Request</h2>
      <p>Hi ${host.name},</p>
      <p>You have a new booking request for your vehicle: ${vehicle.title}</p>

      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Renter:</strong> ${renter.name}</li>
        <li><strong>Renter Email:</strong> ${renter.email}</li>
        <li><strong>Check-in:</strong> ${new Date(booking.startDate).toLocaleDateString()}</li>
        <li><strong>Check-out:</strong> ${new Date(booking.endDate).toLocaleDateString()}</li>
        <li><strong>Guests:</strong> ${booking.guestDetails?.numberOfGuests || 1}</li>
        <li><strong>Total Earnings:</strong> $${booking.totalPrice.toFixed(2)}</li>
      </ul>

      ${booking.specialRequests ? `<p><strong>Special Requests:</strong> ${booking.specialRequests}</p>` : ''}

      <p>Please log in to your dashboard to approve or decline this booking.</p>

      <p>Best regards,<br>The DROOBEE Team</p>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`📧 New booking notification sent to host ${host.email}`);
  } catch (error) {
    console.error('Error sending new booking notification:', error);
  }
};

/**
 * Send new booking notification to admin for approval
 */
const sendAdminBookingNotification = async (booking, renter, vehicle, host) => {
  const ADMIN_EMAIL = 'abdulazizalbadi91@gmail.com';

  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email not sent (SendGrid not configured): Admin booking notification');
    return;
  }

  const msg = {
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject: '🔔 New Booking Requires Admin Approval - DROOBEE',
    html: `
      <h2>🔔 New Booking Awaiting Admin Approval</h2>
      <p>Hi Admin,</p>
      <p>A new booking has been created and requires your approval before proceeding to the host.</p>

      <h3>📅 Booking Details:</h3>
      <ul>
        <li><strong>Booking ID:</strong> ${booking._id}</li>
        <li><strong>Vehicle:</strong> ${vehicle.title}</li>
        <li><strong>Check-in:</strong> ${new Date(booking.startDate).toLocaleDateString()}</li>
        <li><strong>Check-out:</strong> ${new Date(booking.endDate).toLocaleDateString()}</li>
        <li><strong>Duration:</strong> ${booking.numberOfDays} day(s)</li>
        <li><strong>Total Amount:</strong> $${booking.finalTotal.toFixed(2)}</li>
        <li><strong>Payment Status:</strong> ${booking.paymentStatus.toUpperCase()}</li>
      </ul>

      <h3>👤 Guest Information:</h3>
      <ul>
        <li><strong>Name:</strong> ${renter.name}</li>
        <li><strong>Email:</strong> ${renter.email}</li>
        <li><strong>Number of Guests:</strong> ${booking.guestDetails?.numberOfGuests || 1}</li>
      </ul>

      <h3>🏠 Host Information:</h3>
      <ul>
        <li><strong>Name:</strong> ${host.name}</li>
        <li><strong>Email:</strong> ${host.email}</li>
      </ul>

      ${booking.specialRequests ? `<p><strong>Special Requests:</strong><br>${booking.specialRequests}</p>` : ''}

      <hr>
      <p><strong>⚡ Action Required:</strong></p>
      <p>Please review this booking and take action:</p>
      <ul>
        <li><strong>Approve:</strong> The booking will be sent to the host for final approval</li>
        <li><strong>Reject:</strong> The guest will be notified and refunded</li>
      </ul>

      <p>Log in to the admin dashboard to approve or reject this booking.</p>

      <p>Best regards,<br>DROOBEE System</p>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`📧 Admin booking notification sent to ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error('Error sending admin booking notification:', error);
  }
};

/**
 * Send admin approval confirmation to guest
 */
const sendAdminApprovalToGuest = async (booking, renter, vehicle) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email not sent (SendGrid not configured): Admin approval to guest');
    return;
  }

  const msg = {
    to: renter.email,
    from: FROM_EMAIL,
    subject: '✅ Your Booking is Under Review - DROOBEE',
    html: `
      <h2>✅ Admin Approved - Awaiting Host Confirmation</h2>
      <p>Hi ${renter.name},</p>
      <p>Good news! Your booking has been approved by our admin team and is now being sent to the host for final confirmation.</p>

      <h3>📅 Booking Details:</h3>
      <ul>
        <li><strong>Vehicle:</strong> ${vehicle.title}</li>
        <li><strong>Check-in:</strong> ${new Date(booking.startDate).toLocaleDateString()}</li>
        <li><strong>Check-out:</strong> ${new Date(booking.endDate).toLocaleDateString()}</li>
        <li><strong>Total Paid:</strong> $${booking.finalTotal.toFixed(2)}</li>
      </ul>

      <p>You will receive another email once the host confirms your booking.</p>

      <p>Best regards,<br>The DROOBEE Team</p>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`📧 Admin approval email sent to guest ${renter.email}`);
  } catch (error) {
    console.error('Error sending admin approval email:', error);
  }
};

/**
 * Send admin rejection notification to guest with refund info
 */
const sendAdminRejectionToGuest = async (booking, renter, vehicle, reason) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email not sent (SendGrid not configured): Admin rejection to guest');
    return;
  }

  const msg = {
    to: renter.email,
    from: FROM_EMAIL,
    subject: '❌ Booking Update - DROOBEE',
    html: `
      <h2>Booking Not Approved</h2>
      <p>Hi ${renter.name},</p>
      <p>Unfortunately, your booking request for ${vehicle.title} could not be approved at this time.</p>

      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}

      <h3>💰 Refund Information:</h3>
      <p>A full refund of $${booking.finalTotal.toFixed(2)} has been initiated and will be processed to your original payment method within 5-10 business days.</p>

      <p>We apologize for any inconvenience. Please feel free to browse other available vehicles on DROOBEE.</p>

      <p>Best regards,<br>The DROOBEE Team</p>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`📧 Admin rejection email sent to guest ${renter.email}`);
  } catch (error) {
    console.error('Error sending admin rejection email:', error);
  }
};

/**
 * Send notification to admin when user requests to become a host (MVP Simplified)
 */
const sendAdminHostRequestEmail = async (user) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email not sent (SendGrid not configured): Admin host request notification');
    return;
  }

  const ADMIN_EMAIL = 'abdulazizalbadi91@gmail.com';
  const contactInfo = user.hostProfile?.contactInfo || {};
  const rvInfo = user.hostProfile?.rvInfo || {};

  const msg = {
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject: '🚐 NEW HOST REQUEST - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 10px;">
          <h2 style="color: #667eea; margin-top: 0;">🚐 New Host Request Received!</h2>
          <p style="font-size: 16px; color: #333;">A new host wants to list their RV on DROOBEE. Please contact them ASAP.</p>

          <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">📞 Contact Information</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Name:</strong> ${contactInfo.name || user.name}</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Phone:</strong> <a href="tel:${contactInfo.phone}" style="color: #667eea;">${contactInfo.phone || 'N/A'}</a></li>
              <li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>WhatsApp:</strong> <a href="https://wa.me/${contactInfo.whatsapp?.replace(/\D/g,'')}" style="color: #25D366; font-weight: bold;">${contactInfo.whatsapp || 'N/A'}</a></li>
              <li style="padding: 8px 0;"><strong>Email:</strong> <a href="mailto:${contactInfo.email}" style="color: #667eea;">${contactInfo.email || user.email}</a></li>
            </ul>
          </div>

          <div style="background: #fff4e6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <h3 style="color: #333; margin-top: 0;">🚐 RV/Camper Details</h3>
            <p style="margin: 10px 0;"><strong>Description:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">${rvInfo.details || 'No details provided'}</p>
            <p style="margin: 10px 0;"><strong>📍 Location:</strong> ${rvInfo.location || 'Not specified'}</p>
          </div>

          ${user.hostProfile?.notes ? `
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">📝 Additional Notes</h3>
              <p style="margin: 0;">${user.hostProfile.notes}</p>
            </div>
          ` : ''}

          <div style="background: #4CAF50; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px;"><strong>⏰ Action Required:</strong> Contact host within 24 hours</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://wa.me/${contactInfo.whatsapp?.replace(/\D/g,'')}" style="background: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 5px;">
              💬 Message on WhatsApp
            </a>
            <a href="tel:${contactInfo.phone}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 5px;">
              📞 Call Now
            </a>
          </div>

          <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
            Applied: ${new Date(user.hostProfile?.requestedAt).toLocaleString()}
          </p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`📧 Admin host request notification sent to ${ADMIN_EMAIL}`);
    console.log(`📞 WhatsApp: ${contactInfo.whatsapp} | Phone: ${contactInfo.phone}`);
  } catch (error) {
    console.error('Error sending admin host request notification:', error);
  }
};

/**
 * Send approval email to user when host application is approved
 */
const sendHostApprovalEmail = async (user) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email not sent (SendGrid not configured): Host approval');
    return;
  }

  const msg = {
    to: user.email,
    from: FROM_EMAIL,
    subject: '🎉 Your Host Application Has Been Approved - DROOBEE',
    html: `
      <h2>Congratulations, ${user.name}!</h2>
      <p>Your application to become a host on DROOBEE has been <strong>approved</strong>!</p>

      <h3>What's Next?</h3>
      <ul>
        <li>✅ You can now list your RVs and campers on DROOBEE</li>
        <li>✅ Set your own pricing and availability</li>
        <li>✅ Start earning by sharing your vehicles</li>
        <li>✅ Manage bookings through your host dashboard</li>
      </ul>

      <p><strong>Get started by adding your first vehicle listing!</strong></p>

      <p>Welcome to the DROOBEE host community!</p>

      <p>Best regards,<br>The DROOBEE Team</p>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`📧 Host approval email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending host approval email:', error);
  }
};

/**
 * Send rejection email to user when host application is rejected
 */
const sendHostRejectionEmail = async (user, reason) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email not sent (SendGrid not configured): Host rejection');
    return;
  }

  const msg = {
    to: user.email,
    from: FROM_EMAIL,
    subject: 'Host Application Update - DROOBEE',
    html: `
      <h2>Host Application Status Update</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for your interest in becoming a host on DROOBEE.</p>

      <p>Unfortunately, we are unable to approve your host application at this time.</p>

      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}

      <p>You can reapply in the future or contact our support team if you have any questions.</p>

      <p>Best regards,<br>The DROOBEE Team</p>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`📧 Host rejection email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending host rejection email:', error);
  }
};

module.exports = {
  sendBookingConfirmationEmail,
  sendBookingApprovalEmail,
  sendBookingDeclinedEmail,
  sendCancellationEmail,
  sendNewBookingNotificationToHost,
  sendAdminBookingNotification,
  sendAdminApprovalToGuest,
  sendAdminRejectionToGuest,
  sendAdminHostRequestEmail,
  sendHostApprovalEmail,
  sendHostRejectionEmail
};
