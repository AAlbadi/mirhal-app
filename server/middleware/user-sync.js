const User = require('../models/User');

/**
 * Middleware to ensure Supabase user exists in MongoDB
 * (Mostly redundant now as auth.js handles this, but kept for compatibility)
 */
const syncUserToDatabase = async (req, res, next) => {
  try {
    // If auth middleware already populated req.user (Mongoose doc), we are good.
    if (req.user && req.user._id) {
      req.mongoUser = req.user;
      return next();
    }

    // If not, maybe we have a token but no user? (Should not happen with new auth.js)
    return next();
  } catch (error) {
    console.error('Error syncing user to database:', error);
    next();
  }
};

/**
 * Helper function to get or create user by Supabase UID
 */
const getUserBySupabaseUid = async (supabaseUid, userData = {}) => {
  let user = await User.findOne({ supabaseUid });

  if (!user) {
    user = new User({
      supabaseUid,
      email: userData.email || `${supabaseUid}@supabase.user`,
      name: userData.name || 'User',
      picture: userData.picture,
      emailVerified: userData.email_verified || false,
      role: userData.role || 'renter',
    });
    await user.save();
    console.log('✅ User created:', user._id);
  }

  return user;
};

module.exports = {
  syncUserToDatabase,
  getUserBySupabaseUid,
  getUserByFirebaseUid: getUserBySupabaseUid, // Alias for backward compatibility
};
