# Email Notification System Setup

## Overview

The Mirhal booking system now includes automatic email notifications for:
- **New Booking Requests** - Sent to both host and renter
- **Booking Approvals** - Sent to renter when host approves
- **Booking Declines** - Sent to renter when host declines

## Development Mode

By default, emails are logged to the console during development. No configuration needed!

When a booking is created/approved/declined, you'll see formatted email output in your server console like this:

```
📧 EMAIL SENT (Development Mode)
═══════════════════════════════════════
From: Mirhal <noreply@mirhal.com>
To: renter@example.com
Subject: ✅ Booking Request Sent for 2023 Winnebago
───────────────────────────────────────
[Email content here]
═══════════════════════════════════════
```

## Production Setup

For production, configure your email service by adding these environment variables to `server/.env`:

### Option 1: Gmail (Recommended for Testing)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App-Specific Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated password

3. Add to `server/.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM="Mirhal <noreply@mirhal.com>"
```

### Option 2: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com
2. Create an API key at https://app.sendgrid.com/settings/api_keys
3. Add to `server/.env`:

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM="Mirhal <noreply@mirhal.com>"
```

### Option 3: Other SMTP Services

Configure any SMTP service (Mailgun, Amazon SES, etc.):

```env
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASS=your-password
EMAIL_FROM="Mirhal <noreply@mirhal.com>"
```

## Email Templates

All email templates are in `server/services/emailService.js`. You can customize:
- Subject lines
- Email body content
- Formatting and branding

## Testing

### 1. Test in Development Mode
Just create a booking and check your server console for the email output.

### 2. Test with Real Emails
1. Configure email settings in `.env`
2. Restart your server
3. Create a booking
4. Check your inbox!

## Booking Flow with Emails

### 1. Renter Creates Booking
✉️ **Host receives:** "New Booking Request for [Vehicle]"
- Includes guest details, dates, price
- Action button to approve/decline

✉️ **Renter receives:** "Booking Request Sent for [Vehicle]"
- Confirmation of submission
- Pricing breakdown
- Next steps

### 2. Host Approves Booking
✉️ **Renter receives:** "Your Booking is Approved!"
- Confirmation details
- Host contact information
- Next steps (payment, pickup)

### 3. Host Declines Booking
✉️ **Renter receives:** "Booking Update - [Vehicle]"
- Notification of decline
- Suggestions for alternatives

## Troubleshooting

### Emails not sending?
1. Check console for error messages
2. Verify EMAIL_HOST, EMAIL_USER, EMAIL_PASS are correct
3. Check spam folder
4. For Gmail: Ensure 2FA is enabled and you're using an app password

### Still not working?
The system will continue working even if emails fail - bookings will still be created/approved. Check server logs for specific error messages.

## Future Enhancements

Consider adding:
- HTML email templates with branding
- Email verification for new users
- Booking reminders (24 hours before)
- Cancellation notifications
- Payment receipts
- Review requests after booking

---

**Note:** In development, emails log to console by default. Configure EMAIL_* environment variables only for production use.
