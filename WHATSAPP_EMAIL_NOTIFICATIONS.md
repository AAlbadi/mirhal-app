# WhatsApp & Email Notifications System

## Overview
The platform now sends both **WhatsApp** and **Email** notifications for key events to keep admins, hosts, and guests informed.

## Notification Scenarios

### 1. New Host Signup
**When:** A user requests to become a host

**Admin receives:**
- ✅ **WhatsApp** notification with host details (name, email, phone, city)
- ✅ **Email** notification with complete host application details

**Message includes:**
- Host's name, email, phone, address
- Link to admin dashboard for approval
- Bilingual (English & Arabic)

---

### 2. New Booking Created
**When:** A guest makes a new booking request

**Admin receives:**
- ✅ **WhatsApp** notification with booking summary
  - Vehicle name
  - Guest name
  - Check-in/out dates
  - Total amount
  - Link to admin dashboard

**Host receives:**
- ✅ **Email** notification with full booking details
- ✅ **WhatsApp** notification with booking summary
  - Guest contact information
  - Check-in/out dates
  - Total earnings
  - Link to host dashboard

**Guest receives:**
- ✅ **Email** confirmation that booking request was sent
  - Booking details
  - Price breakdown
  - Host contact information

---

### 3. Booking Confirmed by Admin
**When:** Admin approves a booking

**Guest receives:**
- ✅ **Email** notification that booking is approved
- ✅ **WhatsApp** notification with confirmation
  - Vehicle details
  - Check-in/out dates
  - Total paid
  - Host contact details
  - Link to view booking

**Host receives:**
- ✅ **Email** notification about confirmed booking
- ✅ **WhatsApp** notification
  - Guest details
  - Booking dates
  - Earnings information
  - Link to host dashboard

---

### 4. Host Approved by Admin
**When:** Admin approves a host application

**Host receives:**
- ✅ **Email** congratulatory message
  - Next steps to list vehicles
  - Link to add first vehicle
- ✅ **WhatsApp** notification
  - Approval confirmation
  - Link to start listing
  - Bilingual (English & Arabic)

---

## Setup Instructions

### 1. Twilio WhatsApp Configuration

To enable WhatsApp notifications, you need to set up Twilio:

1. **Create a Twilio Account:**
   - Go to https://www.twilio.com/console
   - Sign up for a free account

2. **Get Your Credentials:**
   - Find your Account SID (starts with AC...)
   - Find your Auth Token
   - For testing, use Twilio Sandbox number: `whatsapp:+14155238886`

3. **Update `.env` file:**
   ```env
   TWILIO_ACCOUNT_SID=AC...your_account_sid...
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ADMIN_WHATSAPP_NUMBER=+96894991773
   ```

4. **Connect Your Phone to Sandbox (for testing):**
   - Send `join <your-sandbox-code>` to `+1 415 523 8886` on WhatsApp
   - Your admin number must be connected to receive messages

5. **For Production:**
   - Apply for a Twilio WhatsApp Business number
   - Update `TWILIO_WHATSAPP_NUMBER` with your approved number
   - Get message templates approved by WhatsApp

### 2. Email Configuration

Emails are already configured to use SendGrid:

```env
SENDGRID_API_KEY=SG...your_key...
SENDGRID_FROM_EMAIL=abdulazizalbadi91@gmail.com
```

**Development Mode:**
- If email credentials are not configured, emails will be logged to console
- Perfect for testing without sending real emails

---

## Testing Notifications

### Without Twilio (Development Mode):
- WhatsApp messages will be logged to the console
- You'll see what would be sent, including:
  - Recipient number
  - Message content
  - All formatting

### With Twilio:
- Real WhatsApp messages sent to:
  - Admin number (configured in `.env`)
  - Host phone (from their profile)
  - Guest phone (from booking details)

### Email Testing:
- Check your email inbox (configured in SendGrid)
- Or check server console logs in development mode

---

## Message Templates

All messages are bilingual (English & Arabic) and include:
- Clear formatting with emojis for quick scanning
- Direct links to relevant dashboards
- All essential information (dates, amounts, contact details)
- Professional tone with branding

---

## Troubleshooting

**WhatsApp messages not sending:**
1. Check Twilio credentials in `.env`
2. Verify Account SID starts with "AC"
3. Ensure phone numbers are in E.164 format (+96894991773)
4. For sandbox, confirm phone is connected (sent "join" message)
5. Check server console for error messages

**Emails not sending:**
1. Verify SendGrid API key is valid
2. Check sender email is verified in SendGrid
3. Look for email logs in server console
4. Check spam folder

**Phone number format:**
- Must include country code with +
- Example: +96894991773 (Oman)
- Example: +971501234567 (UAE)
- No spaces or special characters

---

## Cost Information

**Twilio Pricing (approximate):**
- WhatsApp messages: $0.005 per message (very cheap!)
- Free trial credits included with new account

**SendGrid Pricing:**
- Free tier: 100 emails/day
- More than enough for testing and small-scale operation

---

## Support

For issues or questions:
- Check server console logs for detailed error messages
- Twilio Console: https://www.twilio.com/console
- SendGrid Dashboard: https://app.sendgrid.com

---

**✅ System Status:**
- Email notifications: Active
- WhatsApp notifications: Configured (pending Twilio credentials)
- All notification types: Implemented
- Bilingual support: English & Arabic
