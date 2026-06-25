const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationEmail = async (email, name, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Verify Your Host Account - DROOBEE Marketplace',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2D5F5D; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #2D5F5D; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to DROOBEE!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for registering as a host on DROOBEE Marketplace! We're excited to have you join our community of RV and camper hosts.</p>
            <p>To complete your host registration and start listing your vehicles, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2D5F5D;">${verificationUrl}</p>
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with DROOBEE, please ignore this email.</p>
            <p>Happy hosting!</p>
            <p>The DROOBEE Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} DROOBEE Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hi ${name},

      Thank you for registering as a host on DROOBEE Marketplace!

      To complete your host registration and start listing your vehicles, please verify your email address by visiting:

      ${verificationUrl}

      This verification link will expire in 24 hours.

      If you didn't create an account with DROOBEE, please ignore this email.

      Happy hosting!
      The DROOBEE Team
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};

const sendWelcomeEmail = async (email, name) => {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Welcome to DROOBEE Marketplace!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2D5F5D; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to DROOBEE!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Your host account has been verified successfully! You can now start listing your RVs and campers on our platform.</p>
            <p>Get started by:</p>
            <ul>
              <li>Adding your first vehicle listing</li>
              <li>Setting your availability calendar</li>
              <li>Completing your host profile</li>
            </ul>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy hosting!</p>
            <p>The DROOBEE Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} DROOBEE Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
};
