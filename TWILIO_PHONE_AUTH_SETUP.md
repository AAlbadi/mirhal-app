# Twilio Phone Authentication Setup Guide

## What You Need

To enable phone authentication, you need a **Twilio account** (free trial available).

---

## Step 1: Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account
3. Verify your email and phone number

---

## Step 2: Get Your Credentials

After signing up, go to your Twilio Console: https://console.twilio.com/

### Find These 3 Required Values:

**1. Account SID**
- Located on main dashboard
- Looks like: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Copy this entire string

**2. Auth Token**
- Click "Show" next to Auth Token on dashboard  
- Looks like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Copy this entire string

**3. Messaging Service SID** (You need to create this)
- Go to **Messaging** → **Services** in left sidebar
- Click **Create Messaging Service**
- Name it: `Mirhal Auth`
- Use Case: Select **Verify users**
- Click **Create**
- Copy the **Messaging Service SID** (starts with `MG`)

---

## Step 3: Add to Supabase

Now go to your Supabase Dashboard:

1. **Authentication** → **Providers** → **Phone**
2. Toggle **Enable Phone provider** to ON
3. Under **SMS Provider**, select **Twilio**
4. Enter your credentials:
   ```
   Twilio Account SID: ACxxxxxxxx...
   Twilio Auth Token: xxxxxxxx...
   Twilio Message Service SID: MGxxxxxxxx...
   ```
5. Leave **Twilio Content SID** empty (only for WhatsApp)
6. Click **Save**

---

## Step 4: Add Phone Number (Free Trial)

Twilio free trial requires verified phone numbers:

1. In Twilio Console: **Phone Numbers** → **Verified Caller IDs**
2. Click **Add a new Caller ID**
3. Enter your phone number (the one you'll test with)
4. Verify via SMS code

---

## Step 5: Test

1. In your app, enter a phone number
2. Click "Send Code"
3. You'll receive SMS with verification code
4. Enter code to sign in

---

## Important Notes

### Free Trial Limitations
- Can only send to **verified phone numbers**
- Includes **$15 free credit**
- SMS messages show "Sent from a Twilio Trial account"

### Upgrade to Production
To send to any phone number:
1. Add payment method to Twilio
2. Upgrade account (pay-as-you-go, ~$0.0075 per SMS)
3. Get a dedicated phone number (~$1/month)

---

## Cost Estimate

- **Trial**: FREE (limited to verified numbers)
- **Production**: 
  - $0.0075 per SMS sent
  - $1/month for phone number
  - Example: 1000 users/month = ~$8.50

---

## What to Enter in Supabase

Based on your Twilio dashboard:

| Field | Example Value | Where to Find |
|-------|---------------|---------------|
| Account SID | `AC1234567890abcdef...` | Twilio Console home |
| Auth Token | `abcdef1234567890...` | Twilio Console (click Show) |
| Message Service SID | `MG1234567890abcdef...` | Messaging → Services |

**DO NOT** use placeholder text like "AAlbadi's Project" - use the actual SID strings from Twilio!

---

## Quick Start (5 minutes)

1. Sign up: https://www.twilio.com/try-twilio
2. Copy Account SID and Auth Token from dashboard
3. Create Messaging Service → Copy its SID
4. Paste all 3 into Supabase
5. Test with your verified phone number

That's it! 🎉
