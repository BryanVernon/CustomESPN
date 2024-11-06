// utils/dbUtils.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let client;
let db;

const connectToDB = async () => {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db(process.env.DATABASE_NAME); // replace with your DB name if it's fixed
  }
  return db;
};

// Generalized fetchRecords function
export const fetchRecords = (collectionName) => {
  return async (req, res) => {
    try {
      const db = await connectToDB(); // Reuse existing connection
      const records = await db.collection(collectionName).find().toArray();
      res.status(200).json(records);
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: err.message
      });
    }
  };
};
