import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let mongoClient = null;

async function getMongoClient() {
  if (mongoClient) {
    return mongoClient;
  }

  try {
    mongoClient = new MongoClient("mongodb+srv://longerhorn:BMIcNWR1WFLiyL0r@sportsdata.f4hhp.mongodb.net/ncaa?retryWrites=true&w=majority&tlsAllowInvalidCertificates=true", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await mongoClient.connect();
    console.log("Connected to MongoDB");
    return mongoClient;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

export default getMongoClient;
