// ============================================
// utils/db.js - MongoDB Connection & Operations
// ============================================

const { MongoClient } = require('mongodb');

let db;
let client;

async function connectDB() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/fs_promo_bot';
        client = new MongoClient(mongoUri);
        await client.connect();
        db = client.db();
        console.log('✅ Connected to MongoDB');
        
        // Create indexes
        await db.collection('users').createIndex({ userId: 1 }, { unique: true });
        await db.collection('submissions').createIndex({ userId: 1 });
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
}

async function saveUser(userData) {
    try {
        await db.collection('users').updateOne(
            { userId: userData.userId },
            { 
                $set: {
                    ...userData,
                    username: userData.username || null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error saving user:', error);
        throw error;
    }
}

async function getUserData(userId) {
    try {
        return await db.collection('users').findOne({ userId });
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

async function updateUserData(userId, updateData) {
    try {
        await db.collection('users').updateOne(
            { userId },
            { 
                $set: {
                    ...updateData,
                    updatedAt: new Date()
                }
            }
        );
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

async function saveSubmission(submissionData) {
    try {
        await db.collection('submissions').insertOne({
            ...submissionData,
            submittedAt: new Date()
        });
    } catch (error) {
        console.error('Error saving submission:', error);
        throw error;
    }
}

async function updateSubmissionStatus(requestNumber, status) {
    try {
        await db.collection('submissions').updateOne(
            { requestNumber: parseInt(requestNumber) },
            { 
                $set: {
                    status,
                    updatedAt: new Date()
                }
            }
        );
    } catch (error) {
        console.error('Error updating submission status:', error);
        throw error;
    }
}

async function closeDB() {
    if (client) {
        await client.close();
        console.log('✅ MongoDB connection closed');
    }
}

async function getAllUsers() {
    try {
        return await db.collection('users').find({}).toArray();
    } catch (error) {
        console.error('Error getting all users:', error);
        return [];
    }
}

async function getSubmissionStats(userId) {
    try {
        const total = await db.collection('submissions').countDocuments({ userId });
        const player = await db.collection('submissions').countDocuments({ 
            userId, 
            type: 'player' 
        });
        const agent = await db.collection('submissions').countDocuments({ 
            userId, 
            type: { $regex: /agent/ } 
        });
        const affiliate = await db.collection('submissions').countDocuments({ 
            userId, 
            type: { $regex: /affiliate/ } 
        });
        
        return { total, player, agent, affiliate };
    } catch (error) {
        console.error('Error getting submission stats:', error);
        return { total: 0, player: 0, agent: 0, affiliate: 0 };
    }
}

module.exports = {
    connectDB,
    saveUser,
    getUserData,
    updateUserData,
    saveSubmission,
    updateSubmissionStatus,
    getAllUsers,
    getSubmissionStats,
    closeDB
};
