# Mirhal - Scaling Architecture & Best Practices

## 🏗️ Current Architecture

### Authentication & User Management
- **Firebase Authentication**: Handles user authentication (sign-up, login, password reset)
- **MongoDB User Sync**: Automatic sync between Firebase users and MongoDB User documents
- **Dual ID System**:
  - `firebaseUid` (String): Firebase authentication ID
  - `_id` (ObjectId): MongoDB document ID for database relationships
- **Role-Based Access**: Supports `renter`, `host`, `both`, and `admin` roles

### Database Architecture (MongoDB)
```
Users Collection
├── firebaseUid (unique, indexed)
├── email (unique, indexed)
├── role (renter/host/both/admin)
└── hostProfile (for hosts only)

Vehicles Collection
├── hostId → References User._id
├── location (indexed for geo queries)
├── price (indexed for range queries)
└── type (indexed for filtering)

Bookings Collection
├── vehicleId → References Vehicle._id
├── renterId → References User._id (renter)
├── hostId → References User._id (vehicle owner)
├── paymentIntentId (Stripe reference)
├── status (pending/approved/declined/cancelled/completed)
└── paymentStatus (pending/paid/refunded/failed)
```

### Payment Flow (Stripe)
1. **Create Payment Intent**: Pre-authorize payment before booking
2. **Confirm Payment**: Complete payment after user enters card details
3. **Create Booking**: Save booking only after successful payment
4. **Webhook Handling**: Real-time payment status updates from Stripe

---

## 🚀 Scaling to Production (1,000-100,000 Users)

### Phase 1: Small Scale (0-10,000 Users)

#### Infrastructure
```yaml
Frontend (React):
  - Vercel or Netlify
  - CDN for static assets
  - Environment: VITE_API_URL, VITE_STRIPE_PUBLISHABLE_KEY

Backend (Node.js/Express):
  - Single server: AWS EC2 t3.medium or DigitalOcean Droplet (2 CPU, 4GB RAM)
  - PM2 for process management
  - nginx as reverse proxy

Database:
  - MongoDB Atlas M10 (Shared cluster, 2GB RAM)
  - Automatic backups enabled
  - Connection pooling (max 100 connections)

File Storage:
  - AWS S3 or Cloudinary for vehicle images
  - CloudFront CDN for image delivery

Monitoring:
  - PM2 Plus for server monitoring
  - MongoDB Atlas monitoring
  - Stripe Dashboard for payment monitoring
```

#### Cost Estimate
- Frontend (Vercel): Free tier or $20/month
- Backend (EC2 t3.medium): $35/month
- MongoDB Atlas M10: $57/month
- S3 + CloudFront: ~$10/month
- **Total: ~$120/month**

#### Performance Optimization
```javascript
// 1. Implement Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });

// Cache vehicle listings for 5 minutes
app.get('/api/vehicles', async (req, res) => {
  const cacheKey = `vehicles:${JSON.stringify(req.query)}`;
  const cached = await client.get(cacheKey);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const vehicles = await Vehicle.find(query).limit(50);
  await client.setEx(cacheKey, 300, JSON.stringify(vehicles));
  res.json(vehicles);
});

// 2. Implement pagination
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const vehicles = await Vehicle.find(query)
  .skip(skip)
  .limit(limit)
  .lean(); // Use .lean() for faster queries (returns plain JS objects)

// 3. Database indexes (already implemented in models)
// - vehicleId, startDate, endDate on Bookings
// - hostId, renterId, status on Bookings
// - firebaseUid, email on Users
```

### Phase 2: Medium Scale (10,000-50,000 Users)

#### Infrastructure Upgrades
```yaml
Frontend:
  - Same (Vercel scales automatically)

Backend (Load Balanced):
  - 3x AWS EC2 t3.medium instances
  - Application Load Balancer (ALB)
  - Auto-scaling group (min: 2, max: 5)

Database:
  - MongoDB Atlas M30 (Dedicated cluster, 8GB RAM)
  - Replica set (Primary + 2 Secondaries)
  - Read preference: primaryPreferred

Caching:
  - ElastiCache Redis (cache.t3.medium)
  - TTL: 5-15 minutes for listings
  - Session storage for user data

Queue System:
  - AWS SQS or RabbitMQ
  - Async email sending
  - Webhook processing
  - Background jobs (nightly reports, cleanup)

CDN:
  - CloudFront for global content delivery
  - Regional edge locations
```

#### Code Changes for Load Balancing
```javascript
// 1. Sticky sessions for Socket.io (if using real-time features)
const session = require('express-session');
const RedisStore = require('connect-redis').default;

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, maxAge: 86400000 }
}));

// 2. Rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ client: redisClient }),
});

app.use('/api/', limiter);

// 3. Connection pooling
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

#### Cost Estimate
- Frontend (Vercel): $20/month
- Backend (3x EC2 + ALB): ~$150/month
- MongoDB Atlas M30: $280/month
- ElastiCache Redis: $50/month
- S3 + CloudFront: ~$50/month
- **Total: ~$550/month**

### Phase 3: Large Scale (50,000-100,000+ Users)

#### Infrastructure (Microservices Architecture)
```yaml
Frontend:
  - Next.js with SSR/SSG
  - Multiple CDN regions

API Gateway:
  - AWS API Gateway or Kong
  - Rate limiting, authentication, routing

Microservices:
  1. Auth Service (Firebase + User sync)
  2. Vehicle Service (CRUD, search, filters)
  3. Booking Service (reservations, availability)
  4. Payment Service (Stripe integration)
  5. Notification Service (emails, SMS, push)
  6. Review Service (ratings, feedback)

Message Broker:
  - Apache Kafka or AWS Kinesis
  - Event-driven architecture
  - Real-time data streaming

Databases:
  - MongoDB Atlas M50+ with sharding
  - Elasticsearch for search (vehicle listings)
  - PostgreSQL for analytics/reporting

Caching:
  - Multi-tier caching
    - L1: In-memory cache (node-cache)
    - L2: Redis cluster (shared cache)
    - L3: CDN (static content)

Search:
  - Elasticsearch or Algolia
  - Geo-spatial search
  - Full-text search with ranking
```

#### Database Sharding Strategy
```javascript
// Shard by geographic region
const shardKey = {
  'location.coordinates': 'hashed'
};

// Or shard by hostId for even distribution
const shardKey = {
  hostId: 'hashed'
};

// MongoDB will automatically distribute data across shards
```

#### Event-Driven Architecture Example
```javascript
// Booking Service publishes events
const bookingCreated = {
  type: 'BOOKING_CREATED',
  data: {
    bookingId: '...',
    vehicleId: '...',
    renterId: '...',
    hostId: '...',
    startDate: '...',
    endDate: '...',
    totalPrice: 1000
  }
};

await kafka.publish('booking-events', bookingCreated);

// Email Service subscribes to booking events
kafka.subscribe('booking-events', async (event) => {
  if (event.type === 'BOOKING_CREATED') {
    await sendBookingConfirmationEmail(event.data);
    await sendNewBookingNotificationToHost(event.data);
  }
});
```

#### Cost Estimate
- Frontend (Vercel Pro): $100/month
- API Gateway: $200/month
- Microservices (6x EC2 instances): ~$400/month
- MongoDB Atlas M50 + Sharding: $800/month
- Elasticsearch: $300/month
- Kafka/Kinesis: $200/month
- Redis Cluster: $150/month
- S3 + CloudFront: ~$200/month
- **Total: ~$2,350/month**

---

## 🔒 Security Best Practices

### 1. API Security
```javascript
// Rate limiting by user (not just IP)
const rateLimitByUser = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => req.user?.uid || req.ip,
  standardHeaders: true,
});

// Input validation
const { body, validationResult } = require('express-validator');

app.post('/api/bookings', [
  body('vehicleId').isMongoId(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('guestDetails.email').isEmail(),
  body('guestDetails.phone').isMobilePhone(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process booking...
});

// SQL/NoSQL injection prevention
// - Use parameterized queries
// - Sanitize user input
// - Use Mongoose schemas (already doing this)
```

### 2. Payment Security
```javascript
// Verify payment intent ownership before confirming
const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

if (paymentIntent.metadata.userId !== req.user.uid) {
  return res.status(403).json({ error: 'Unauthorized' });
}

// Implement idempotency for payment operations
app.post('/api/payments/confirm', async (req, res) => {
  const { paymentIntentId } = req.body;

  // Check if booking already exists
  const existingBooking = await Booking.findOne({ paymentIntentId });
  if (existingBooking) {
    return res.json({ booking: existingBooking }); // Idempotent response
  }

  // Create new booking...
});
```

### 3. Data Protection
```javascript
// Encrypt sensitive data at rest
const crypto = require('crypto');

function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Store encrypted data
user.hostProfile.phone = encrypt(phoneNumber);

// GDPR Compliance: Data deletion
async function deleteUserData(userId) {
  // Remove personal data but keep anonymized records for analytics
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        email: 'deleted@example.com',
        name: '[Deleted User]',
        picture: null,
        firebaseUid: crypto.randomUUID(),
      }
    }
  );

  // Keep booking history for business records but anonymize
  await Booking.updateMany(
    { renterId: userId },
    { $set: { 'guestDetails.email': 'deleted@example.com' } }
  );
}
```

---

## 📊 Monitoring & Observability

### Key Metrics to Track
```javascript
// 1. Application Metrics
const prometheus = require('prom-client');

const bookingCounter = new prometheus.Counter({
  name: 'bookings_total',
  help: 'Total number of bookings',
  labelNames: ['status']
});

const paymentDuration = new prometheus.Histogram({
  name: 'payment_processing_duration_seconds',
  help: 'Duration of payment processing',
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Track bookings
bookingCounter.inc({ status: 'completed' });

// Track payment duration
const timer = paymentDuration.startTimer();
await processPayment();
timer();

// 2. Error Tracking (Sentry)
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());

// 3. Log Aggregation (Winston + CloudWatch)
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

logger.info('Booking created', {
  bookingId: booking._id,
  vehicleId: booking.vehicleId,
  userId: booking.renterId,
  amount: booking.finalTotal
});
```

### Alerting Rules
```yaml
Alerts:
  - name: HighErrorRate
    condition: error_rate > 5%
    window: 5 minutes
    action: notify_slack

  - name: SlowResponseTime
    condition: avg_response_time > 2000ms
    window: 10 minutes
    action: notify_pagerduty

  - name: DatabaseConnectionPool
    condition: active_connections > 80% of max_pool_size
    window: 5 minutes
    action: scale_up

  - name: PaymentFailureRate
    condition: payment_failure_rate > 10%
    window: 15 minutes
    action: notify_slack + notify_pagerduty
```

---

## 🎯 Role-Based Access Control (RBAC)

### Current Implementation
The system already has a robust role system in the User model:

```javascript
// User roles: 'renter', 'host', 'both', 'admin'

// Middleware for role-based access
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await getUserByFirebaseUid(req.user.uid);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!allowedRoles.includes(user.role) && !user.isAdmin) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.mongoUser = user;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
};

// Usage in routes
app.post('/api/vehicles',
  verifyFirebaseToken,
  requireRole('host', 'both'),
  createVehicle
);

app.get('/api/admin/users',
  verifyFirebaseToken,
  requireRole('admin'),
  getAllUsers
);

app.post('/api/bookings',
  verifyFirebaseToken,
  requireRole('renter', 'both'),
  createBooking
);
```

### Host Approval Workflow
```javascript
// Becoming a host requires approval
async function requestHostAccess(req, res) {
  const user = await getUserByFirebaseUid(req.user.uid);

  if (user.role === 'host' || user.role === 'both') {
    return res.status(400).json({ error: 'Already a host' });
  }

  user.role = user.role === 'renter' ? 'both' : 'host';
  user.hostProfile = {
    approvalStatus: 'pending',
    requestedAt: new Date(),
    bio: req.body.bio,
    phone: req.body.phone,
    address: req.body.address,
  };

  await user.save();

  // Notify admins
  await notifyAdminsOfHostRequest(user);

  res.json({ message: 'Host access requested. Awaiting approval.' });
}

// Admin approves host
async function approveHost(req, res) {
  const { userId } = req.params;
  const adminUser = req.mongoUser;

  if (!adminUser.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const user = await User.findById(userId);
  user.hostProfile.approvalStatus = 'approved';
  user.hostProfile.isApproved = true;
  user.hostProfile.approvedBy = adminUser._id;
  user.hostProfile.approvedAt = new Date();

  await user.save();
  await sendHostApprovalEmail(user);

  res.json({ message: 'Host approved successfully' });
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Jest)
```javascript
describe('Payment Controller', () => {
  it('should create payment intent with correct amount', async () => {
    const req = {
      user: { uid: 'test-user' },
      body: {
        vehicleId: 'vehicle123',
        startDate: '2025-11-01',
        endDate: '2025-11-03',
        numberOfGuests: 2
      }
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await createPaymentIntent(req, res);

    expect(res.json).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].amount).toBe(1870); // 2 nights * 850 + 10% fee
  });
});
```

### Integration Tests
```javascript
describe('Booking Flow', () => {
  it('should complete full booking with payment', async () => {
    // 1. Create payment intent
    const paymentIntent = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        vehicleId: testVehicle._id,
        startDate: '2025-11-01',
        endDate: '2025-11-03'
      });

    expect(paymentIntent.status).toBe(200);
    expect(paymentIntent.body.clientSecret).toBeDefined();

    // 2. Confirm payment (simulate Stripe confirmation)
    const booking = await request(app)
      .post('/api/payments/confirm-payment')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        paymentIntentId: paymentIntent.body.paymentIntentId
      });

    expect(booking.status).toBe(201);
    expect(booking.body.booking.status).toBe('pending');
    expect(booking.body.booking.paymentStatus).toBe('paid');
  });
});
```

---

## 📝 Summary

### Current Status
✅ Authentication (Firebase + MongoDB sync)
✅ Role-based access (renter/host/both/admin)
✅ Payment processing (Stripe)
✅ Booking management
✅ Database indexing
✅ Basic error handling

### Ready for Production Checklist
- [ ] Add Redis caching layer
- [ ] Implement rate limiting
- [ ] Set up monitoring (Sentry, Prometheus)
- [ ] Configure CI/CD pipeline
- [ ] Add comprehensive logging
- [ ] Set up automated backups
- [ ] Implement GDPR compliance
- [ ] Add unit + integration tests
- [ ] Configure SSL/TLS certificates
- [ ] Set up CDN for static assets
- [ ] Implement email queue system
- [ ] Add database connection pooling
- [ ] Set up staging environment
- [ ] Configure environment variables properly
- [ ] Add health check endpoints
- [ ] Implement graceful shutdown

### Estimated Timeline to Production
- Week 1-2: Testing, bug fixes, monitoring setup
- Week 3: DevOps setup (CI/CD, infrastructure)
- Week 4: Security audit, performance optimization
- Week 5: Beta testing with real users
- Week 6: Production launch

**The system is architecturally sound and ready to scale!** 🚀
