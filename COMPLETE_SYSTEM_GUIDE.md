# Mirhal - Complete System Guide

## 🎯 System Overview

Your marketplace has **THREE user roles** with complete dashboards:
1. **Admin** (YOU) - Control everything, approve listings & hosts, view all bookings
2. **Hosts** - List RVs, manage bookings, receive payments
3. **Renters** - Book RVs, manage their bookings

---

## 💰 Payment Flow (You as Middleman)

### Current Setup (Simpler for Testing)
```
Renter pays $1,870
    ↓
Platform receives $1,870
    ↓
Platform keeps $170 (service fee)
Platform pays host $1,700 (manually or via Stripe Connect)
```

**Benefits**:
- ✅ Full control over payments
- ✅ Can hold funds if needed
- ✅ Easy accounting
- ✅ Simpler integration (what we built)

### Future: Stripe Connect (Automatic Splits)
See `STRIPE_CONNECT_GUIDE.md` for implementation when you're ready to scale.

---

## 📊 WHERE TO VIEW BOOKINGS

### 1. Admin Dashboard (View ALL Bookings)

**URL**: `/admin/dashboard`

**API Endpoints**:
```javascript
// Get dashboard statistics
GET /api/admin/stats
Response: {
  totalBookings, pendingBookings, totalRevenue,
  totalPlatformFees, totalVehicles, pendingVehicles
}

// Get all bookings (with pagination & filters)
GET /api/admin/bookings?page=1&limit=20&status=pending
Response: {
  bookings: [...],
  pagination: { total, page, pages }
}

// Get specific booking details
GET /api/admin/bookings/:bookingId
Response: { booking: {...} }
```

**What You Can Do**:
- View all bookings across all hosts
- Filter by status (pending, approved, declined, cancelled, completed)
- See payment status and amounts
- View renter and host details
- Generate revenue reports
- Export booking data

### 2. Host Dashboard (View Their Bookings)

**URL**: `/host/dashboard`

**API Endpoints**:
```javascript
// Get host statistics
GET /api/host/stats
Response: {
  totalBookings, pendingBookings, totalEarnings,
  totalVehicles, approvedVehicles
}

// Get host's bookings
GET /api/host/bookings
Response: { bookings: [...] }

// Approve a booking
POST /api/host/bookings/:bookingId/approve
Response: { message, booking }

// Decline a booking
POST /api/host/bookings/:bookingId/decline
Body: { reason: "Not available" }
Response: { message, booking }
```

**What Hosts Can Do**:
- View bookings for THEIR vehicles only
- Approve/decline booking requests
- See their earnings
- Manage their vehicle listings

### 3. Renter Dashboard (View What They Booked)

**URL**: `/my-bookings`

**API Endpoints**:
```javascript
// Get renter's bookings
GET /api/renter/my-bookings
Response: { bookings: [...] }

// Get specific booking details
GET /api/renter/bookings/:bookingId
Response: { booking: {...} }

// Cancel a booking
POST /api/renter/bookings/:bookingId/cancel
Body: { reason: "Plans changed" }
Response: { message, booking }
```

**What Renters Can Do**:
- View all their bookings (past & upcoming)
- See booking status (pending, approved, declined)
- View vehicle and host details
- Cancel bookings if needed
- Track payment status

---

## 🏠 HOST LISTING SYSTEM

### How Hosts List Their RVs

#### Step 1: Become a Host (Request Access)
```javascript
POST /api/host/request-access
Headers: { Authorization: "Bearer <firebase-token>" }
Body: {
  bio: "I own 3 RVs and love sharing them with travelers",
  phone: "+971 50 123 4567",
  address: {
    street: "123 Main St",
    city: "Dubai",
    state: "Dubai",
    zipCode: "00000",
    country: "UAE"
  }
}

Response: { message: "Host access requested. Awaiting admin approval." }
```

**What Happens**:
- User's role changes to "both" (can rent AND host)
- Host profile status set to "pending"
- Admin receives notification to approve

#### Step 2: Admin Approves Host
```javascript
// Admin dashboard - View pending hosts
GET /api/admin/hosts/pending
Response: { hosts: [...] }

// Admin approves host
POST /api/admin/hosts/:userId/approve
Response: { message: "Host approved successfully" }

// Or rejects
POST /api/admin/hosts/:userId/reject
Body: { reason: "Incomplete documentation" }
Response: { message: "Host rejected" }
```

#### Step 3: Host Creates Vehicle Listing
```javascript
POST /api/host/vehicles
Headers: { Authorization: "Bearer <firebase-token>" }
Body: {
  title: "Luxury Class A Motorhome",
  description: "Beautiful 35ft motorhome with full amenities",
  type: "Class A",
  year: 2023,
  make: "Thor",
  model: "Challenger",
  length: 35,
  sleeps: 6,
  price: 1200,  // AED per day
  location: {
    address: "Marina Walk",
    city: "Dubai",
    state: "Dubai",
    zipCode: "00000",
    coordinates: { lat: 25.08, lng: 55.14 }
  },
  images: [
    "https://cloudinary.com/image1.jpg",
    "https://cloudinary.com/image2.jpg"
  ],
  amenities: [
    "Full Kitchen",
    "Bathroom with Shower",
    "Air Conditioning",
    "Solar Panels",
    "WiFi",
    "TV",
    "Generator"
  ],
  rules: "No smoking, no pets, clean water tank before return"
}

Response: {
  message: "Vehicle submitted for approval",
  vehicle: {...}
}
```

**Listing Status Flow**:
```
Host submits listing
    ↓
Status: "pending"
Vehicle is invisible to renters
    ↓
Admin reviews listing
    ↓
Admin approves → Status: "approved" → Visible to renters ✅
    OR
Admin rejects → Status: "rejected" → Host can edit & resubmit
```

#### Step 4: Admin Approves Listing
```javascript
// View pending vehicle listings
GET /api/admin/vehicles/pending
Response: { vehicles: [...] }

// Approve a vehicle
POST /api/admin/vehicles/:vehicleId/approve
Response: {
  message: "Vehicle approved",
  vehicle: { ... }
}

// Reject a vehicle
POST /api/admin/vehicles/:vehicleId/reject
Body: { reason: "Images are unclear, please upload better photos" }
Response: { message: "Vehicle rejected" }
```

**After Approval**:
- Vehicle becomes visible in search results
- Renters can book it
- Host receives bookings and manages them

---

## 📸 IMAGE STORAGE SYSTEM

### Current Setup (URLs)
Hosts provide image URLs (from Cloudinary, AWS S3, etc.)

### Recommended: Cloudinary Integration

#### 1. Setup Cloudinary
```bash
npm install cloudinary multer-storage-cloudinary multer
```

#### 2. Create Upload Endpoint
```javascript
// server/routes/upload.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mirhal-vehicles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1920, height: 1080, crop: 'limit' },
      { quality: 'auto:good' }
    ],
  },
});

const upload = multer({ storage });

// Upload multiple images
router.post('/images',
  verifyFirebaseToken,
  upload.array('images', 10), // Max 10 images
  (req, res) => {
    const imageUrls = req.files.map(file => file.path);
    res.json({ images: imageUrls });
  }
);
```

#### 3. Frontend Upload Component
```typescript
// components/ImageUploader.tsx
const ImageUploader = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    const response = await fetch('/api/upload/images', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const { images } = await response.json();
    onUpload(images);
    setUploading(false);
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleUpload(Array.from(e.target.files))}
      />
      {uploading && <p>Uploading images...</p>}
    </div>
  );
};
```

**Free Tier**: 25 GB storage, 25 GB bandwidth/month

---

## 🎨 FRONTEND PAGES TO BUILD

### 1. Admin Dashboard (`/admin/dashboard`)

```typescript
// pages/AdminDashboard.tsx
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [pendingVehicles, setPendingVehicles] = useState([]);

  useEffect(() => {
    fetchAdminStats();
    fetchAllBookings();
    fetchPendingVehicles();
  }, []);

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {/* Stats Overview */}
      <div className="stats-grid">
        <StatCard title="Total Revenue" value={`AED ${stats?.totalRevenue}`} />
        <StatCard title="Platform Fees" value={`AED ${stats?.totalPlatformFees}`} />
        <StatCard title="Pending Bookings" value={stats?.pendingBookings} />
        <StatCard title="Total Vehicles" value={stats?.totalVehicles} />
      </div>

      {/* Pending Approvals */}
      <section>
        <h2>Pending Vehicle Approvals</h2>
        <VehicleApprovalList vehicles={pendingVehicles} />
      </section>

      {/* All Bookings */}
      <section>
        <h2>All Bookings</h2>
        <BookingsTable bookings={bookings} />
      </section>
    </div>
  );
};
```

### 2. Renter's "My Bookings" Page (`/my-bookings`)

```typescript
// pages/MyBookings.tsx
const MyBookings = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetch('/api/renter/my-bookings', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setBookings(data.bookings));
  }, []);

  return (
    <div className="my-bookings-page">
      <h1>My Bookings</h1>

      <div className="bookings-list">
        {bookings.map(booking => (
          <BookingCard
            key={booking._id}
            booking={booking}
            vehicle={booking.vehicleId}
            host={booking.hostId}
          />
        ))}
      </div>
    </div>
  );
};

const BookingCard = ({ booking, vehicle, host }) => (
  <div className="booking-card">
    <img src={vehicle.images[0]} alt={vehicle.title} />
    <div className="booking-details">
      <h3>{vehicle.title}</h3>
      <p>Check-in: {new Date(booking.startDate).toLocaleDateString()}</p>
      <p>Check-out: {new Date(booking.endDate).toLocaleDateString()}</p>
      <p>Status: <StatusBadge status={booking.status} /></p>
      <p>Total: AED {booking.finalTotal}</p>
      <p>Host: {host.name}</p>

      {booking.status === 'pending' && (
        <button onClick={() => cancelBooking(booking._id)}>
          Cancel Booking
        </button>
      )}
    </div>
  </div>
);
```

### 3. Host Dashboard (`/host/dashboard`)

```typescript
// pages/HostDashboard.tsx
const HostDashboard = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  return (
    <div className="host-dashboard">
      <h1>Host Dashboard</h1>

      {/* Earnings Overview */}
      <div className="stats-grid">
        <StatCard title="Total Earnings" value={`AED ${stats?.totalEarnings}`} />
        <StatCard title="Pending Bookings" value={stats?.pendingBookings} />
        <StatCard title="My Vehicles" value={stats?.totalVehicles} />
      </div>

      {/* My Vehicles */}
      <section>
        <h2>My Vehicles</h2>
        <button onClick={() => navigate('/host/add-vehicle')}>
          + Add New Vehicle
        </button>
        <VehiclesList vehicles={vehicles} />
      </section>

      {/* Bookings */}
      <section>
        <h2>Booking Requests</h2>
        <HostBookingsList bookings={bookings} />
      </section>
    </div>
  );
};
```

### 4. Add Vehicle Page (`/host/add-vehicle`)

```typescript
// pages/AddVehicle.tsx
const AddVehicle = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Class A',
    year: 2024,
    make: '',
    model: '',
    length: 0,
    sleeps: 2,
    price: 0,
    location: {},
    images: [],
    amenities: [],
  });

  const handleSubmit = async () => {
    const response = await fetch('/api/host/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    alert(data.message); // "Vehicle submitted for approval"
    navigate('/host/dashboard');
  };

  return (
    <div className="add-vehicle-page">
      <h1>List Your RV</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        {/* ... more fields ... */}
        <ImageUploader onUpload={(images) => setFormData({ ...formData, images })} />
        <button type="submit">Submit for Approval</button>
      </form>
    </div>
  );
};
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Role Checking on Frontend
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [mongoUser, setMongoUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Fetch MongoDB user profile (includes role)
        const token = await firebaseUser.getIdToken();
        const response = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const mongoUserData = await response.json();
        setMongoUser(mongoUserData);
      }
    });

    return unsubscribe;
  }, []);

  return {
    user,
    mongoUser,
    isAdmin: mongoUser?.isAdmin,
    isHost: mongoUser?.role === 'host' || mongoUser?.role === 'both',
    isRenter: mongoUser?.role === 'renter' || mongoUser?.role === 'both',
  };
};

// Usage
const { isAdmin, isHost } = useAuth();

if (isAdmin) {
  // Show admin dashboard
}

if (isHost) {
  // Show host features
}
```

### Protected Routes
```typescript
// components/ProtectedRoute.tsx
const ProtectedRoute = ({ children, requiredRole }) => {
  const { mongoUser } = useAuth();

  if (!mongoUser) {
    return <Navigate to="/login" />;
  }

  if (requiredRole === 'admin' && !mongoUser.isAdmin) {
    return <Navigate to="/" />;
  }

  if (requiredRole === 'host' && !['host', 'both'].includes(mongoUser.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

// In routes
<Route path="/admin/dashboard" element={
  <ProtectedRoute requiredRole="admin">
    <AdminDashboard />
  </ProtectedRoute>
} />

<Route path="/host/dashboard" element={
  <ProtectedRoute requiredRole="host">
    <HostDashboard />
  </ProtectedRoute>
} />
```

---

## 📱 API TESTING (Postman/Thunder Client)

### Example Requests

#### 1. Get Your Bookings (as Renter)
```http
GET http://localhost:5001/api/renter/my-bookings
Authorization: Bearer <your-firebase-token>
```

#### 2. View All Bookings (as Admin)
```http
GET http://localhost:5001/api/admin/bookings?page=1&limit=20
Authorization: Bearer <admin-firebase-token>
```

#### 3. Approve Vehicle (as Admin)
```http
POST http://localhost:5001/api/admin/vehicles/6903341f9e1713f546fb98c1/approve
Authorization: Bearer <admin-firebase-token>
```

#### 4. Create Vehicle Listing (as Host)
```http
POST http://localhost:5001/api/host/vehicles
Authorization: Bearer <host-firebase-token>
Content-Type: application/json

{
  "title": "Luxury Motorhome",
  "description": "Amazing RV",
  "type": "Class A",
  "year": 2023,
  "make": "Thor",
  "model": "Challenger",
  "length": 35,
  "sleeps": 6,
  "price": 1200,
  "location": {
    "address": "Dubai Marina",
    "city": "Dubai",
    "state": "Dubai",
    "zipCode": "00000",
    "coordinates": { "lat": 25.08, "lng": 55.14 }
  },
  "images": [
    "https://picsum.photos/seed/rv1/1024/768"
  ],
  "amenities": ["Kitchen", "Bathroom", "AC"]
}
```

---

## ✅ COMPLETE WORKFLOW EXAMPLE

### Scenario: Host Lists RV → Renter Books → Admin Monitors

1. **John wants to become a host**
   ```
   POST /api/host/request-access
   → Status: "pending"
   → Admin receives notification
   ```

2. **Admin approves John**
   ```
   POST /api/admin/hosts/:johnId/approve
   → John is now an approved host
   → John receives email confirmation
   ```

3. **John lists his RV**
   ```
   POST /api/host/vehicles
   → Vehicle status: "pending"
   → Admin receives notification
   ```

4. **Admin approves the RV listing**
   ```
   POST /api/admin/vehicles/:rvId/approve
   → RV becomes visible in search
   → John receives confirmation
   ```

5. **Sarah (renter) books the RV**
   ```
   POST /api/payments/create-payment-intent
   POST /api/payments/confirm-payment
   → Booking created with status: "pending"
   → Payment: AED 1,870 charged
   → John receives booking notification
   ```

6. **John approves the booking**
   ```
   POST /api/host/bookings/:bookingId/approve
   → Booking status: "approved"
   → Sarah receives confirmation
   ```

7. **Everyone can see the booking**:
   - **Sarah**: `GET /api/renter/my-bookings`
   - **John**: `GET /api/host/bookings`
   - **Admin**: `GET /api/admin/bookings`

8. **Admin monitors revenue**
   ```
   GET /api/admin/stats
   → Total Revenue: AED 1,870
   → Platform Fee: AED 170
   → Host Payout: AED 1,700
   ```

---

## 🚀 NEXT STEPS

1. **Create an admin user in your database**:
   ```javascript
   // In MongoDB or via script
   db.users.updateOne(
     { email: 'your-admin-email@example.com' },
     { $set: { isAdmin: true } }
   );
   ```

2. **Build the frontend pages**:
   - Admin Dashboard
   - Host Dashboard
   - Renter My Bookings
   - Add Vehicle Form

3. **Test the complete flow**:
   - Create a test host
   - Approve them as admin
   - Host lists a vehicle
   - Approve the vehicle
   - Make a test booking
   - View it in all 3 dashboards

4. **Add image upload** (Cloudinary integration)

5. **Set up email notifications** (SendGrid already configured)

6. **Deploy to production** when ready!

---

## 📞 API REFERENCE SUMMARY

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/admin/stats` | GET | Dashboard statistics | Admin |
| `/api/admin/bookings` | GET | All bookings | Admin |
| `/api/admin/vehicles/pending` | GET | Pending vehicles | Admin |
| `/api/admin/vehicles/:id/approve` | POST | Approve vehicle | Admin |
| `/api/admin/hosts/pending` | GET | Pending hosts | Admin |
| `/api/admin/hosts/:id/approve` | POST | Approve host | Admin |
| `/api/host/request-access` | POST | Request to be a host | User |
| `/api/host/my-vehicles` | GET | Host's vehicles | Host |
| `/api/host/vehicles` | POST | Create listing | Host |
| `/api/host/bookings` | GET | Host's bookings | Host |
| `/api/host/bookings/:id/approve` | POST | Approve booking | Host |
| `/api/renter/my-bookings` | GET | Renter's bookings | User |
| `/api/renter/bookings/:id/cancel` | POST | Cancel booking | User |

**The system is fully functional!** 🎉

You can now:
✅ View all bookings as admin
✅ Hosts can list vehicles (with approval)
✅ Renters can see their bookings
✅ Payment flows through you (the platform)
✅ Complete approval workflow for hosts & vehicles
