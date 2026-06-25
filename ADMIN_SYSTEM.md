# Admin System for Host Approval

## Overview

The Mirhal platform now includes an admin approval system for new hosts. When users apply to become hosts, their applications must be reviewed and approved by the admin before they can list vehicles.

**Admin Email:** `abdulazizalbadi91@gmail.com`

---

## How It Works

### 1. User Applies to Become a Host
- User fills out the "Become a Host" form
- Application is saved with status: `pending`
- Admin receives an email notification

### 2. Admin Reviews Application
- Admin logs in with abdulazizalbadi91@gmail.com
- Reviews host applications in the admin dashboard
- Can approve or reject applications

### 3. Host is Notified
- Approved hosts receive congratulations email
- Rejected hosts receive notification with reason
- Approved hosts can immediately start listing vehicles

---

## Admin API Endpoints

All admin endpoints require authentication and admin privileges.

### Base URL
```
http://localhost:5001/api/admin
```

### Authentication
All requests must include:
```
Authorization: Bearer <firebase_id_token>
```

---

### GET /pending-hosts
Get all pending host applications.

**Response:**
```json
{
  "pendingHosts": [
    {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "hostProfile": {
        "approvalStatus": "pending",
        "requestedAt": "2025-10-29T12:00:00.000Z",
        "phone": "+1234567890",
        "bio": "..."
      },
      "createdAt": "2025-10-28T10:00:00.000Z"
    }
  ]
}
```

---

### GET /all-hosts?status=pending
Get all hosts (approved, pending, or rejected).

**Query Parameters:**
- `status` (optional): `pending`, `approved`, or `rejected`

**Response:**
```json
{
  "hosts": [
    {
      "_id": "user_id",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "hostProfile": {
        "approvalStatus": "approved",
        "approvedBy": {
          "name": "Admin Name",
          "email": "admin@example.com"
        },
        "approvedAt": "2025-10-29T11:30:00.000Z"
      }
    }
  ]
}
```

---

### PUT /approve-host/:userId
Approve a host application.

**Request:**
```http
PUT /api/admin/approve-host/65abc123def456789
```

**Response:**
```json
{
  "message": "Host approved successfully",
  "user": {
    "id": "65abc123def456789",
    "name": "John Doe",
    "email": "john@example.com",
    "approvalStatus": "approved"
  }
}
```

**Email Sent:**
- Host receives approval email with next steps

---

### PUT /reject-host/:userId
Reject a host application.

**Request:**
```http
PUT /api/admin/reject-host/65abc123def456789
Content-Type: application/json

{
  "reason": "Incomplete application. Please provide valid documentation."
}
```

**Response:**
```json
{
  "message": "Host rejected",
  "user": {
    "id": "65abc123def456789",
    "name": "John Doe",
    "email": "john@example.com",
    "approvalStatus": "rejected"
  }
}
```

**Email Sent:**
- Host receives rejection email with reason

---

### GET /stats
Get admin dashboard statistics.

**Response:**
```json
{
  "stats": {
    "pendingHosts": 5,
    "approvedHosts": 42,
    "rejectedHosts": 3,
    "totalUsers": 150
  }
}
```

---

## Email Notifications

### Admin Receives (on new host application):
```
Subject: 🏕️ New Host Application - John Doe

Hello Admin,

A new host application has been submitted...

👤 HOST DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Name: John Doe
• Email: john@example.com
• Phone: +1234567890
• Applied: 10/29/2025, 1:00 PM

⚡ ACTION REQUIRED:
Please log in to review this application.
```

### Host Receives (on approval):
```
Subject: 🎊 Your Host Application is Approved!

Congratulations! Your host application has been APPROVED!

You can now:
✅ List your RVs and campers
✅ Set your own pricing
✅ Accept booking requests
✅ Start earning money!

🚀 NEXT STEPS:
1. Log in to your account
2. Go to "Become a Host"
3. Add your first vehicle
```

### Host Receives (on rejection):
```
Subject: 📋 Update on Your Host Application

Thank you for your interest in becoming a host.

Unfortunately, we are unable to approve your application at this time.

📋 REASON:
[Admin's reason here]

🔄 WHAT'S NEXT?
• Reply with additional information
• Contact support
• Resubmit after addressing feedback
```

---

## User Model Changes

### New Fields:
```javascript
{
  role: {
    type: String,
    enum: ['renter', 'host', 'both', 'admin'],
    default: 'renter'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  hostProfile: {
    isApproved: Boolean,              // Quick check
    approvalStatus: String,            // 'pending', 'approved', 'rejected'
    approvedBy: ObjectId,              // Admin who approved
    approvedAt: Date,                  // When approved
    rejectionReason: String,           // Why rejected
    requestedAt: Date,                 // When applied
    // ... other fields
  }
}
```

---

## Testing in Development

### 1. Create Host Application
```bash
# User applies to be a host via frontend
# Or via API:
POST /api/users/become-host
```

### 2. Check Server Console
You'll see:
```
📧 EMAIL SENT (Development Mode)
To: abdulazizalbadi91@gmail.com
Subject: 🏕️ New Host Application - John Doe
[Full email content]
```

### 3. Approve as Admin
```bash
# Log in as abdulazizalbadi91@gmail.com
# Then:
curl -X PUT http://localhost:5001/api/admin/approve-host/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Check Console Again
```
📧 EMAIL SENT (Development Mode)
To: john@example.com
Subject: 🎊 Your Host Application is Approved!
[Full email content]
```

---

## Production Setup

### 1. Set Admin in Database
```javascript
// MongoDB shell or script
db.users.updateOne(
  { email: 'abdulazizalbadi91@gmail.com' },
  { $set: { isAdmin: true, role: 'admin' } }
);
```

### 2. Configure Email Service
See `EMAIL_SETUP.md` for email configuration.

### 3. Build Admin Dashboard (Frontend)
Create admin pages for:
- Viewing pending applications
- Approving/rejecting hosts
- Viewing host statistics

---

## Security Notes

✅ **Admin Check:**
- Middleware checks if user email === 'abdulazizalbadi91@gmail.com'
- OR if user.isAdmin === true
- Unauthorized users get 403 Forbidden

✅ **Authentication Required:**
- All admin routes require valid Firebase token
- Token verified before any operation

✅ **Email Validation:**
- Admin email hardcoded in middleware
- Cannot be changed without code update

---

## Future Enhancements

Consider adding:
- [ ] Multiple admin users
- [ ] Role-based permissions (super admin, moderator)
- [ ] Admin activity logs
- [ ] Batch approve/reject
- [ ] Automated approval based on criteria
- [ ] Host verification documents upload
- [ ] Admin dashboard frontend
- [ ] Push notifications for new applications

---

## Files Modified/Created

### Backend:
1. `server/models/User.js` - Added admin fields
2. `server/middleware/admin.js` - Admin authentication (NEW)
3. `server/routes/admin.js` - Admin routes (NEW)
4. `server/services/emailService.js` - Host approval emails
5. `server/index.js` - Registered admin routes

### Documentation:
1. `ADMIN_SYSTEM.md` - This file (NEW)
2. `EMAIL_SETUP.md` - Email configuration guide

---

## Quick Start

1. **Backend running:** ✅ (port 5001)
2. **MongoDB connected:** ✅
3. **Admin email:** abdulazizalbadi91@gmail.com
4. **Test it:**
   - Have a user apply to be a host
   - Check server console for admin email
   - Use admin API to approve/reject
   - Check console for host notification email

**Everything is ready to go!**
