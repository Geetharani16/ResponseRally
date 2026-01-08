/**
 * Database Integration Layer
 * 
 * This file provides an abstraction layer for database operations.
 * Currently using in-memory storage, but can be easily switched to 
 * actual database implementations like MongoDB, PostgreSQL, etc.
 */

class Database {
  constructor() {
    // In-memory storage for sessions (replace with actual database connection)
    this.sessions = new Map();
    this.users = new Map();
    this.responses = new Map();
    
    console.log('Database layer initialized with in-memory storage');
  }

  // Session operations
  async createSession(sessionData) {
    this.sessions.set(sessionData.id, sessionData);
    return sessionData;
  }

  async getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  async updateSession(sessionId, updateData) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    // Update the session with new data
    Object.assign(session, updateData, { updatedAt: new Date() });
    this.sessions.set(sessionId, session);
    return session;
  }

  async deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  // User operations
  async createUser(userData) {
    this.users.set(userData.id, userData);
    return userData;
  }

  async getUser(userId) {
    return this.users.get(userId);
  }

  async updateUser(userId, updateData) {
    const user = this.users.get(userId);
    if (!user) return null;
    
    Object.assign(user, updateData);
    this.users.set(userId, user);
    return user;
  }

  // Response operations
  async createResponse(responseData) {
    this.responses.set(responseData.id, responseData);
    return responseData;
  }

  async getResponse(responseId) {
    return this.responses.get(responseId);
  }

  async updateResponse(responseId, updateData) {
    const response = this.responses.get(responseId);
    if (!response) return null;
    
    Object.assign(response, updateData);
    this.responses.set(responseId, response);
    return response;
  }

  // Utility methods
  async getAllSessions() {
    return Array.from(this.sessions.values());
  }

  async clearExpiredSessions() {
    // In a real implementation, this would remove sessions that haven't been used in a while
    console.log('Session cleanup would happen here in a real implementation');
  }
}

// Initialize database instance
const db = new Database();

module.exports = db;