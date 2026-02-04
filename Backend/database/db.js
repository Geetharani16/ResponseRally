/**
 * MongoDB Database Integration Layer
 * 
 * This file provides an abstraction layer for MongoDB database operations.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'ResponseRally';

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.sessions = null;
    this.conversations = null;
    this.responses = null;
    this.users = null;

    // this.connect(); // Removed to prevent unhandled promise rejection
  }

  async connect() {
    try {
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db(DB_NAME);

      // Initialize collections
      this.sessions = this.db.collection('sessions');
      this.conversations = this.db.collection('conversations');
      this.responses = this.db.collection('responses');
      this.users = this.db.collection('users');

      console.log('Connected to MongoDB database');
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  // Session operations
  async createSession(sessionData) {
    try {
      const result = await this.sessions.insertOne({
        ...sessionData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { ...sessionData, _id: result.insertedId };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(sessionId) {
    try {
      return await this.sessions.findOne({ id: sessionId });
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  async updateSession(sessionId, updateData) {
    try {
      const result = await this.sessions.findOneAndUpdate(
        { id: sessionId },
        {
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );
      return result;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId) {
    try {
      const result = await this.sessions.deleteOne({ id: sessionId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  // User operations
  async createUser(userData) {
    try {
      const result = await this.users.insertOne({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { ...userData, _id: result.insertedId };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUser(userId) {
    try {
      return await this.users.findOne({ id: userId });
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      return await this.users.findOne({ email });
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const result = await this.users.findOneAndUpdate(
        { id: userId },
        {
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );
      return result;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Response operations
  async createResponse(responseData) {
    try {
      // Ensure isBest field is properly set (defaults to false if not provided)
      const responseToInsert = {
        ...responseData,
        isBest: responseData.isBest === true, // Ensure boolean value
        createdAt: new Date()
      };

      const result = await this.responses.insertOne(responseToInsert);
      return { ...responseToInsert, _id: result.insertedId };
    } catch (error) {
      console.error('Error creating response:', error);
      throw error;
    }
  }

  async getResponse(responseId) {
    try {
      return await this.responses.findOne({ id: responseId });
    } catch (error) {
      console.error('Error getting response:', error);
      throw error;
    }
  }

  async getResponsesByConversation(conversationId) {
    try {
      return await this.responses.find({ conversationId }).toArray();
    } catch (error) {
      console.error('Error getting responses by conversation:', error);
      throw error;
    }
  }

  async updateResponse(responseId, updateData) {
    try {
      const result = await this.responses.findOneAndUpdate(
        { id: responseId },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      return result;
    } catch (error) {
      console.error('Error updating response:', error);
      throw error;
    }
  }

  // Conversation operations
  async createConversation(conversationData) {
    try {
      const result = await this.conversations.insertOne({
        ...conversationData,
        createdAt: new Date()
      });
      return { ...conversationData, _id: result.insertedId };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async getConversationsBySession(sessionId) {
    try {
      return await this.conversations.find({ sessionId }).sort({ turnIndex: 1 }).toArray();
    } catch (error) {
      console.error('Error getting conversations by session:', error);
      throw error;
    }
  }

  async getConversation(conversationId) {
    try {
      return await this.conversations.findOne({ id: conversationId });
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  // Analytics methods
  async getAnalytics(userId) {
    try {
      const pipeline = [
        {
          $lookup: {
            from: 'conversations',
            localField: 'id',
            foreignField: 'sessionId',
            as: 'conversations'
          }
        },
        {
          $lookup: {
            from: 'responses',
            localField: 'conversations.id',
            foreignField: 'conversationId',
            as: 'responses'
          }
        },
        {
          $group: {
            _id: '$userId',
            totalSessions: { $sum: 1 },
            totalConversations: { $sum: { $size: '$conversations' } },
            totalResponses: { $sum: { $size: '$responses' } },
            totalBestResponses: { $sum: { $size: { $filter: { input: '$responses', cond: { $eq: ['$$this.isBest', true] } } } } },
            avgResponseTime: { $avg: { $avg: '$responses.metrics.latencyMs' } },
            providerStats: {
              $push: {
                provider: '$responses.provider',
                count: { $size: '$responses' }
              }
            }
          }
        }
      ];

      const result = await this.sessions.aggregate(pipeline).toArray();
      return result[0] || null;
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  // Utility methods
  async getAllSessions() {
    try {
      return await this.sessions.find({}).toArray();
    } catch (error) {
      console.error('Error getting all sessions:', error);
      throw error;
    }
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }
  }
}

const db = new Database();
module.exports = db;