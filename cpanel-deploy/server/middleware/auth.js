const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const User = require('../models/User');

// Hardcoded fallback for "Lazy Mode"
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lujdzxjgydpxejnemjcj.supabase.co';

// Configure JWKS Client
const client = jwksClient({
  jwksUri: `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      console.error('Error getting signing key:', err.message);
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const checkJwt = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    // Some robust handling for frontend sometimes sending "null" string
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Use our constant
    if (!SUPABASE_URL) {
      console.error('❌ SUPABASE_URL is missing.');
      return res.status(500).json({ error: 'Server Config Error: Missing URL' });
    }

    // Verify using JWKS
    jwt.verify(token, getKey, { algorithms: ['RS256', 'HS256', 'ES256'] }, async (err, decodedToken) => {
      if (err) {
        console.error('❌ JWKS Verification Failed:', err.message);

        // Fallback: Try verifying with SECRET if JWKS fails (Backwards compatibility for legacy setup)
        if (process.env.SUPABASE_JWT_SECRET) {
          try {
            const fallbackDecoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
            return await processUser(req, res, next, fallbackDecoded);
          } catch (secretErr) {
            console.error('❌ Secret Verification Failed:', secretErr.message);
            return res.status(401).json({ error: 'Auth Failed (Secret) - Backend v2.0: ' + secretErr.message });
          }
        }

        return res.status(401).json({ error: 'Auth Failed (JWKS) - Backend v2.0: ' + err.message });
      }

      await processUser(req, res, next, decodedToken);
    });

  } catch (error) {
    console.error('❌ Authentication middleware error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const processUser = async (req, res, next, decodedToken) => {
  // Check if the user exists in our MongoDB
  let user = await User.findOne({ supabaseUid: decodedToken.sub });

  if (!user) {
    // Create new user if not exists (Auto-sync)
    const userCount = await User.countDocuments();
    user = new User({
      supabaseUid: decodedToken.sub,
      email: decodedToken.email,
      name: decodedToken.user_metadata?.full_name || decodedToken.user_metadata?.name || decodedToken.email?.split('@')[0],
      picture: decodedToken.user_metadata?.avatar_url || decodedToken.user_metadata?.picture,
      emailVerified: decodedToken.email_verified || false,
      role: userCount === 0 ? 'admin' : 'renter',
      isAdmin: userCount === 0,
    });
    await user.save();
    console.log('✅ New user synced to MongoDB:', user._id);
  }

  req.user = user;
  next();
};

const verifyFirebaseToken = checkJwt; // Aliasing for backward compatibility if needed

const attachUser = async (req, res, next) => {
  if (req.user) return next();
  return res.status(401).json({ error: 'Unauthorized' });
};

const requireHost = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isHost = req.user.role === 'host' || req.user.role === 'both' || req.user.isHost === true;

    if (!isHost) {
      // DISABLED: Allow all authenticated users to submit spots
    }

    if (req.user.hostProfile && req.user.hostProfile.status !== 'approved') {
      // DISABLED: Allow submissions without approval
    }

    next();
  } catch (error) {
    console.error('Error checking host role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const requireEmailVerified = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.user.emailVerified) {
      // Optional: Enforce email verification
      // return res.status(403).json({ error: 'Please verify your email address first.' });
    }

    next();
  } catch (error) {
    console.error('Error checking email verification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const requireAdmin = async (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
};

module.exports = {
  checkJwt,
  verifyFirebaseToken,
  attachUser,
  requireHost,
  requireEmailVerified,
  requireAdmin
};
