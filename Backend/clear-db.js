/**
 * Database Clear Script
 * 
 * This script completely clears all collections in the database to start fresh.
 */

const Database = require('./database/db');

async function clearDatabase() {
  const db = new Database();
  try {
    await db.connect();
    console.log('Connected to database');
    
    // Get counts before clearing
    const sessionCountBefore = await db.sessions.countDocuments();
    const conversationCountBefore = await db.conversations.countDocuments();
    const responseCountBefore = await db.responses.countDocuments();
    const userCountBefore = await db.users.countDocuments();
    
    console.log('=== DATA COUNTS BEFORE CLEARING ===');
    console.log(`Sessions: ${sessionCountBefore}`);
    console.log(`Conversations: ${conversationCountBefore}`);
    console.log(`Responses: ${responseCountBefore}`);
    console.log(`Users: ${userCountBefore}`);
    console.log('==================================');
    
    // Clear all collections
    await db.sessions.deleteMany({});
    await db.conversations.deleteMany({});
    await db.responses.deleteMany({});
    await db.users.deleteMany({});
    
    console.log('\nAll collections have been cleared!');
    
    // Verify data is cleared
    const sessionCountAfter = await db.sessions.countDocuments();
    const conversationCountAfter = await db.conversations.countDocuments();
    const responseCountAfter = await db.responses.countDocuments();
    const userCountAfter = await db.users.countDocuments();
    
    console.log('\n=== DATA COUNTS AFTER CLEARING ===');
    console.log(`Sessions: ${sessionCountAfter}`);
    console.log(`Conversations: ${conversationCountAfter}`);
    console.log(`Responses: ${responseCountAfter}`);
    console.log(`Users: ${userCountAfter}`);
    console.log('=================================');
    
    console.log('\nDatabase has been completely cleared! Ready for fresh start.');
    
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await db.close();
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  clearDatabase();
}

module.exports = clearDatabase;