/**
 * Script to truncate (clear) all collections in the ResponseRally database
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'ResponseRally';

async function truncateDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(DB_NAME);
    console.log(`Connected to database: ${DB_NAME}`);
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`, collections.map(c => c.name));
    
    // Drop each collection to truncate all data
    for (const collection of collections) {
      console.log(`Dropping collection: ${collection.name}`);
      await db.collection(collection.name).drop();
      console.log(`✓ Collection ${collection.name} dropped`);
    }
    
    console.log('\n✅ Database truncation completed!');
    console.log('All collections have been dropped.');
    console.log('You may need to restart your application to recreate empty collections.');
    
  } catch (error) {
    console.error('❌ Error truncating database:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Execute the truncation
if (require.main === module) {
  truncateDatabase();
}

module.exports = truncateDatabase;