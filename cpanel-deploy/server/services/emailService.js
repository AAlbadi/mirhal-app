const nodemailer = require('nodemailer');

// Initialize Transporter
// REQUIRES: Env vars SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
let transporter = null;

const initTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('✅ SMTP Transporter Initialized');
  } else {
    console.warn('⚠️ SMTP Credentials missing. Emails will be mocked.');
  }
};

// Initialize on load
initTransporter();

/**
 * Send a welcome email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 */
const sendWelcomeEmail = async (to, name) => {
  if (!transporter) {
    console.log(`[MOCK EMAIL] To: ${to}, Subject: Welcome to Mirhal!`);
    return { success: true, mock: true };
  }

  const mailOptions = {
    from: '"Mirhal Support" <support@mirhal.com>',
    to: to,
    subject: 'Welcome to Mirhal! ⛺',
    html: `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #F97316;">Welcome to Mirhal, ${name}!</h1>
        <p>We are thrilled to have you join our community of outdoor enthusiasts and hosts.</p>
        <p>Start exploring the best camping spots in the GCC, or list your own hidden gem today.</p>
        <div style="margin: 30px 0;">
          <a href="https://mirhal.app" style="background-color: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acccess Your Account</a>
        </div>
        <p>See you out there!</p>
        <p>The Mirhal Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail
};
