const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
// const helmet = require('helmet'); // Removed for deployment stability
const rateLimit = require('express-rate-limit');

// CRITICAL: Load .env file manually for cPanel compatibility
const { loadEnvFile } = require('./load-env');
loadEnvFile();

dotenv.config();

const app = express();

// CORS configuration - allow both localhost and network IP
// Must be at the very top to ensure headers are added even for rate-limited requests
// Middleware to log all request origins for debugging
app.use((req, res, next) => {
  console.log(`[Request] Method: ${req.method}, Path: ${req.path}, Origin: ${req.headers.origin}`);
  next();
});

// CORS configuration - allow both localhost and network IP
app.use(cors({
  origin: function (origin, callback) {
    // SECURITY: Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    const allowed = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://192.168.1.3:3000',
      'http://192.168.1.5:3000',
      'https://mirhal.app',
      'http://mirhal.app',
      'capacitor://localhost',
      'http://localhost',
      'capacitor://mirhal.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowed.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      console.warn('Blocked CORS Origin:', origin);
      // For now, fail safe but log it. Or deny. 
      // var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      // return callback(new Error(msg), false);
      return callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security: Helmet removed for easier deployment (avoid npm install)
// CSP issues resolved by not enforcing strict policy
app.disable('x-powered-by');

// FORCEFULLY REMOVE CSP HEADERS (in case they are set by default or proxy)
app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-WebKit-CSP');
  next();
});

// DISABLED: Rate limiting causes crashes in cPanel proxy environment
// Uncomment these sections if you move to a different hosting provider
/*
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use('/api/', (req, res, next) => {
  if (req.path.startsWith('/webhooks/stripe')) {
    return next();
  }
  return apiLimiter(req, res, next);
});

app.use('/api/auth/', authLimiter);
app.use('/api/payments/', authLimiter);
*/


// Stripe webhook - must be BEFORE express.json() to get raw body
const { handleWebhook } = require('./controllers/webhookController');
// Safe Import for Push Notifications
let sendToTopic, subscribeToTopic;
try {
  const fbService = require('./services/firebaseService');
  sendToTopic = fbService.sendToTopic;
  subscribeToTopic = fbService.subscribeToTopic;
} catch (error) {
  console.warn('⚠️ Warning: firebaseService not found. Push notifications will be disabled.');
  // Mock functions to prevent crash
  sendToTopic = async () => ({ success: false, error: 'Push notifications disabled (module missing)' });
  subscribeToTopic = async () => ({ success: false, error: 'Push notifications disabled (module missing)' });
}
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleWebhook);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug: Log all incoming requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'SUPABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('⚠️ Missing optional environment variables:', missingEnvVars.join(', '));
  console.warn('Application might have limited functionality.');
}



// MongoDB Connection with retry logic
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mirhal-marketplace';
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully to:', uri.split('/').pop().split('?')[0]);

    // AUTO-REPAIR: Fix 0,0 coordinates on startup if needed
    try {
      const { runAutoRepair } = require('./utils/autoRepair');
      runAutoRepair();
    } catch (e) {
      console.warn('Auto-repair module failed to load:', e.message);
    }
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Geocoding Proxy Endpoint
app.get('/api/geocode', async (req, res) => {
  try {
    const { address, language } = req.query;
    if (!address) {
      return res.status(400).json({ status: 'INVALID_REQUEST', error: 'Address is required' });
    }

    // Use the server-side API key (or fallback to frontend one if same)
    // Hardcoding the working key for now based on successful curl test
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCPIv0b3IZHRL2mGwxDPaFwc8SfZl5-RfM';

    // Construct Google Maps API URL
    const components = 'country:sa|country:ae|country:kw|country:qa|country:bh|country:om';
    const lang = language || 'en';

    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=${components}&language=${lang}&key=${apiKey}`;

    // Use native fetch (Node 18+) or install node-fetch if needed. 
    // To be safe, let's use the https module which is built-in
    const https = require('https');
    const url = require('url'); // Need url module to parse options

    const options = {
      headers: {
        'Referer': 'https://mirhal.app/' // TRICK: Send allowed referrer for Browser Key
      }
    };

    https.get(googleUrl, options, (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        try {
          const jsonResponse = JSON.parse(data);
          res.json(jsonResponse);
        } catch (e) {
          res.status(500).json({ status: 'ERROR', error: 'Failed to parse Google API response' });
        }
      });

    }).on('error', (err) => {
      console.error('Geocoding API error:', err);
      res.status(500).json({ status: 'ERROR', error: 'Failed to connect to Google Maps API' });
    });

  } catch (error) {
    console.error('Geocoding proxy error:', error);
    res.status(500).json({ status: 'ERROR', error: 'Internal Server Error' });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews').router);
app.use('/api/trails', require('./routes/trails'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
const Report = require('./models/Report'); // Import Report model

app.use('/api/host', require('./routes/host'));
app.use('/api/renter', require('./routes/renter'));

// Compliance: Report Endpoint
app.post('/api/reports', async (req, res) => {
  try {
    console.log('🚩 New Report Received:', req.body);

    // Save to MongoDB
    const report = new Report({
      spotId: req.body.spotId,
      spotName: req.body.spotName,
      reason: req.body.reason,
      details: req.body.details,
      status: 'pending'
    });

    await report.save();
    console.log('✅ Report saved to DB:', report._id);

    res.status(200).json({ success: true, message: 'Report received' });
  } catch (error) {
    console.error('❌ Error saving report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// ==========================================
// PUSH NOTIFICATION ROUTES
// ==========================================

// Subscribe a device token to 'all_users' topic
app.post('/api/notifications/subscribe', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  try {
    // Subscribe the token to the global topic
    await subscribeToTopic([token], 'all_users');
    res.json({ success: true, message: 'Subscribed to notifications' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Admin: Send Notification to 'all_users'
app.post('/api/notifications/send', async (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body required' });
  }

  try {
    const result = await sendToTopic('all_users', title, body);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Send error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ==========================================
// EMAIL ROUTES
// ==========================================

// Send Welcome Email
app.post('/api/notifications/email/welcome', async (req, res) => {
  const { email, name } = req.body;

  // Use the email service
  const { sendWelcomeEmail } = require('./services/emailService');

  try {
    // If mocking, we still return success
    await sendWelcomeEmail(email, name || 'User');
    res.json({ success: true, message: 'Welcome email sent' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Debug route to verify server config removed for production safety

// Serve static files from the React app (Production)
// But NOT for API routes
const path = require('path');
app.use((req, res, next) => {
  // Skip static file serving for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  express.static(path.join(__dirname, '../../public_html'))(req, res, next);
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
// BUT NOT for API routes - let them 404 naturally
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public_html/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
