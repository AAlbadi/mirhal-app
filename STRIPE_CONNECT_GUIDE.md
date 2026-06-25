# Stripe Connect for Marketplace Payments

## 🎯 Current vs. Target Payment Flow

### ❌ Current Flow (NOT IDEAL FOR MARKETPLACE)
```
Renter → Stripe → Your Platform Account
```
**Problem**: All money goes to YOU. You manually need to pay hosts later.

### ✅ Target Flow (STRIPE CONNECT - MARKETPLACE MODEL)
```
Renter → Stripe → Host's Stripe Account (minus your fee)
                → Your Platform Account (your commission)
```
**Benefit**: Automatic payment splitting! You take 10% fee, host gets 90%.

---

## 💰 Payment Split Example

**Booking Total**: AED 1,870
- Rental (2 nights × 850): AED 1,700
- Service Fee (10%): AED 170
- **Total Charged to Renter**: AED 1,870

**Automatic Split**:
- **Platform (You)**: AED 170 (service fee) → Goes to YOUR Stripe account
- **Host**: AED 1,700 (rental amount) → Goes to HOST's Stripe account

---

## 🏗️ How Stripe Connect Works

### 1. Host Onboarding
```javascript
// Host clicks "Become a Host" or "Start Earning"
// System creates Stripe Connected Account for them
const account = await stripe.accounts.create({
  type: 'express', // Easy onboarding, Stripe handles compliance
  country: 'AE', // UAE
  email: host.email,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
});

// Save Stripe Account ID to host's profile
host.stripeConnectAccountId = account.id;
await host.save();

// Send host to Stripe onboarding page
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: 'https://mirhal.com/host/onboarding',
  return_url: 'https://mirhal.com/host/dashboard',
  type: 'account_onboarding',
});

// Redirect host to accountLink.url
// Stripe collects: Bank account, ID verification, tax info
```

### 2. Payment Processing
```javascript
// When renter books, charge their card
const paymentIntent = await stripe.paymentIntents.create({
  amount: 187000, // AED 1,870 in fils (1 AED = 100 fils)
  currency: 'aed',
  application_fee_amount: 17000, // AED 170 platform fee
  transfer_data: {
    destination: host.stripeConnectAccountId, // Host gets AED 1,700
  },
  metadata: {
    bookingId: '...',
    hostId: '...',
    renterId: '...',
  }
});

// Stripe automatically:
// - Charges renter AED 1,870
// - Transfers AED 1,700 to host's bank account
// - Keeps AED 170 in YOUR platform account
```

### 3. Payout Schedule
```
Day 1: Renter pays AED 1,870
Day 2: Stripe holds funds (fraud protection)
Day 3: Host receives AED 1,700 in their bank account
Day 3: You receive AED 170 in your platform account
```

---

## 🔧 Implementation Steps

### Step 1: Enable Stripe Connect in Dashboard
1. Go to: https://dashboard.stripe.com/settings/connect
2. Enable **Connect** for your account
3. Configure settings:
   - Platform name: "Mirhal"
   - Brand color: Your primary color
   - Business type: "Marketplace"

### Step 2: Update User Model
```javascript
// Add to User schema
stripeConnectAccountId: {
  type: String, // Stripe Connected Account ID
  sparse: true, // Only hosts have this
},
stripeAccountStatus: {
  type: String,
  enum: ['not_created', 'pending', 'active', 'restricted'],
  default: 'not_created',
},
```

### Step 3: Host Onboarding API
```javascript
// POST /api/host/stripe/onboard
async function createStripeConnectAccount(req, res) {
  const user = req.mongoUser;

  if (user.role !== 'host' && user.role !== 'both') {
    return res.status(403).json({ error: 'Must be a host' });
  }

  // Create Stripe account if doesn't exist
  if (!user.stripeConnectAccountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'AE',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        product_description: `RV and camper rentals by ${user.name}`,
      },
    });

    user.stripeConnectAccountId = account.id;
    user.stripeAccountStatus = 'pending';
    await user.save();
  }

  // Generate onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: user.stripeConnectAccountId,
    refresh_url: `${process.env.FRONTEND_URL}/host/onboarding`,
    return_url: `${process.env.FRONTEND_URL}/host/dashboard`,
    type: 'account_onboarding',
  });

  res.json({ url: accountLink.url });
}
```

### Step 4: Update Payment Intent Creation
```javascript
// Modify createPaymentIntent in paymentController.js
const host = await User.findById(vehicle.hostId);

if (!host.stripeConnectAccountId || host.stripeAccountStatus !== 'active') {
  return res.status(400).json({
    error: 'Host has not completed payment setup',
  });
}

// Platform fee calculation
const totalPrice = pricePerDay * nights; // AED 1,700
const platformFee = totalPrice * 0.10; // AED 170 (10%)
const finalTotal = totalPrice + platformFee; // AED 1,870

const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(finalTotal * 100), // Convert to fils
  currency: 'aed',
  application_fee_amount: Math.round(platformFee * 100), // Your fee
  transfer_data: {
    destination: host.stripeConnectAccountId, // Host gets rental amount
  },
  metadata: {
    userId,
    vehicleId,
    hostId: host._id.toString(),
    totalPrice: totalPrice.toString(),
    platformFee: platformFee.toString(),
    finalTotal: finalTotal.toString(),
  },
});
```

---

## 📊 Admin Dashboard - View All Bookings

### Backend Route
```javascript
// GET /api/admin/bookings
router.get('/bookings',
  verifyFirebaseToken,
  requireRole('admin'),
  async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      // Search by booking ID or vehicle title
      query.$or = [
        { _id: new mongoose.Types.ObjectId(search) },
        // Add more search fields
      ];
    }

    const bookings = await Booking.find(query)
      .populate('vehicleId', 'title type location price')
      .populate('renterId', 'name email')
      .populate('hostId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  }
);

// GET /api/admin/stats
router.get('/stats',
  verifyFirebaseToken,
  requireRole('admin'),
  async (req, res) => {
    const stats = {
      totalBookings: await Booking.countDocuments(),
      pendingBookings: await Booking.countDocuments({ status: 'pending' }),
      approvedBookings: await Booking.countDocuments({ status: 'approved' }),
      totalRevenue: await Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$finalTotal' } } }
      ]),
      totalPlatformFees: await Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$serviceFee' } } }
      ]),
      recentBookings: await Booking.find()
        .populate('vehicleId', 'title')
        .populate('renterId', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
    };

    res.json(stats);
  }
);
```

---

## 🎨 Frontend Admin Dashboard

### Page: `/admin/bookings`
```
+----------------------------------------------------------+
| MIRHAL ADMIN DASHBOARD                                    |
+----------------------------------------------------------+
| 📊 Overview                                               |
| ┌─────────────┬─────────────┬─────────────┬─────────────┐|
| │Total Revenue│   Pending   │  Completed  │ Platform Fee ||
| │  AED 50,000 │     15      │     230     │  AED 5,000  ||
| └─────────────┴─────────────┴─────────────┴─────────────┘|
|                                                           |
| 🔍 Search: [___________] Status: [All ▼] [Search]        |
|                                                           |
| 📋 All Bookings (245 total)                              |
| ┌──────────────────────────────────────────────────────┐ |
| │ ID        │ Vehicle   │ Renter    │ Dates    │ Status│ |
| ├──────────────────────────────────────────────────────┤ |
| │ #BK001    │ RV Class A│ John Doe  │ Nov 1-3  │ Paid  │ |
| │ #BK002    │ Camper Van│ Jane Smith│ Nov 5-7  │Pending│ |
| │ #BK003    │ Trailer   │ Bob Wilson│ Nov 10-15│ Paid  │ |
| └──────────────────────────────────────────────────────┘ |
|                                                           |
| « Previous  1  2  3  4  5  Next »                        |
+----------------------------------------------------------+
```

### Features:
✅ View all bookings across all hosts
✅ Filter by status (pending, approved, declined, completed)
✅ Search by booking ID, renter name, vehicle
✅ See payment status and amounts
✅ Quick actions: Approve, Decline, Refund
✅ Export to CSV for accounting

---

## 🏠 Host Dashboard - View Their Bookings

### Page: `/host/bookings`
```
+----------------------------------------------------------+
| MY BOOKINGS (Host View)                                   |
+----------------------------------------------------------+
| 💰 This Month's Earnings: AED 12,500                      |
| 📦 Pending Bookings: 3                                    |
|                                                           |
| 🚐 My Vehicles' Bookings                                  |
| ┌──────────────────────────────────────────────────────┐ |
| │ Vehicle       │ Renter      │ Dates      │ Earnings  │ |
| ├──────────────────────────────────────────────────────┤ |
| │ Luxury RV     │ John Doe    │ Nov 1-3    │ AED 1,700 │ |
| │ [⚠️ Pending]   │ jane@...    │            │ [Approve] │ |
| │               │             │            │ [Decline] │ |
| ├──────────────────────────────────────────────────────┤ |
| │ Camper Van    │ Bob Wilson  │ Nov 5-10   │ AED 4,250 │ |
| │ [✅ Approved]  │ bob@...     │            │ [Details] │ |
| └──────────────────────────────────────────────────────┘ |
+----------------------------------------------------------+
```

### Backend Route
```javascript
// GET /api/host/bookings
router.get('/bookings',
  verifyFirebaseToken,
  requireRole('host', 'both'),
  async (req, res) => {
    const host = req.mongoUser;

    const bookings = await Booking.find({ hostId: host._id })
      .populate('vehicleId', 'title images price')
      .populate('renterId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  }
);

// POST /api/host/bookings/:id/approve
router.post('/bookings/:id/approve',
  verifyFirebaseToken,
  requireRole('host', 'both'),
  async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (booking.hostId.toString() !== req.mongoUser._id.toString()) {
      return res.status(403).json({ error: 'Not your booking' });
    }

    booking.status = 'approved';
    await booking.save();

    // Send email to renter
    await sendBookingApprovedEmail(booking);

    res.json({ booking });
  }
);
```

---

## 🔄 Complete Flow Diagram

```
RENTER PERSPECTIVE:
1. Browse vehicles
2. Select dates & book
3. Enter payment (Stripe checkout)
4. Wait for host approval
5. Receive booking confirmation
6. Enjoy the trip!

HOST PERSPECTIVE:
1. Complete Stripe Connect onboarding
2. List vehicles
3. Receive booking request notification
4. Approve/Decline booking
5. Meet renter for vehicle handoff
6. Receive payment in bank account (automatic)

PLATFORM (YOU) PERSPECTIVE:
1. View all bookings in admin dashboard
2. Monitor payment status
3. Handle disputes/refunds if needed
4. Receive platform fees automatically
5. Generate financial reports
```

---

## 💵 Revenue Tracking

### Your Platform Revenue
```javascript
// Total platform fees earned
const platformRevenue = await Booking.aggregate([
  { $match: { paymentStatus: 'paid' } },
  { $group: {
    _id: null,
    totalServiceFees: { $sum: '$serviceFee' },
    totalBookings: { $sum: 1 }
  }}
]);

// Monthly breakdown
const monthlyRevenue = await Booking.aggregate([
  { $match: { paymentStatus: 'paid' } },
  { $group: {
    _id: {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' }
    },
    revenue: { $sum: '$serviceFee' },
    bookings: { $sum: 1 }
  }},
  { $sort: { '_id.year': -1, '_id.month': -1 } }
]);
```

---

## 🚀 Next Steps

1. **Enable Stripe Connect in your Stripe Dashboard**
2. **I'll implement the code** (user model updates, APIs, dashboards)
3. **Test with Stripe Test Mode** (use test connected accounts)
4. **Launch in Production** when ready

Want me to implement all of this now?
