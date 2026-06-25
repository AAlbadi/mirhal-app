const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get all indexes
    const indexes = await usersCollection.indexes();
    console.log('\n📋 Current indexes:', indexes.map(i => i.name));

    // Drop old auth0Id index if it exists
    try {
      await usersCollection.dropIndex('auth0Id_1');
      console.log('✅ Dropped old auth0Id_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ️  auth0Id_1 index does not exist (already dropped)');
      } else {
        throw err;
      }
    }

    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropOldIndexes();
