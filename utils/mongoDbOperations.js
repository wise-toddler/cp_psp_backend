const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment variables.');
}

if (!dbName) {
    throw new Error('MONGODB_DB_NAME is not defined in the environment variables.');
}

let client = null;
let db = null;

async function connect() {
    if (client) return db;  // If already connected, return the existing db instance
    
    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log('Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

async function disconnect() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('Disconnected from MongoDB');
    }
}

async function find(collection, filter, sort = {}, limit = 100) {
    if (!db) throw new Error('Database not connected. Call connect() first.');
    return await db.collection(collection).find(filter).sort(sort).limit(limit).toArray();
}

async function findOne(collection, filter) {
    if (!db) throw new Error('Database not connected. Call connect() first.');
    return await db.collection(collection).findOne(filter);
}

async function insertOne(collection, document) {
    if (!db) throw new Error('Database not connected. Call connect() first.');
    const result = await db.collection(collection).insertOne(document);
    return result.insertedId;
}

async function updateOne(collection, filter, update, options = {}) {
    if (!db) throw new Error('Database not connected. Call connect() first.');
    const result = await db.collection(collection).updateOne(filter, update, options);
    return result.modifiedCount;
}

async function deleteOne(collection, filter) {
    if (!db) throw new Error('Database not connected. Call connect() first.');
    const result = await db.collection(collection).deleteOne(filter);
    return result.deletedCount;
}

async function deleteMany(collection, filter) {
    if (!db) throw new Error('Database not connected. Call connect() first.');
    const result = await db.collection(collection).deleteMany(filter);
    return result.deletedCount;
}
async function clearCollection(collection) {
    if (!db) throw new Error('Database not connected. Call connect() first.');
    await db.collection(collection).deleteMany({});
}

function getUpdateFilter(id) {
    if (ObjectId.isValid(id)) {
        return { _id: new ObjectId(id) };
    }
    return { _id: id };
}

module.exports = {
    connect,
    disconnect,
    find,
    findOne,
    insertOne,
    updateOne,
    deleteOne,
    ObjectId,
    getUpdateFilter,
    deleteMany,
    clearCollection
};