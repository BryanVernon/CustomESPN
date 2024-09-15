import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import gamesRouter from './routes/games.js'; // Adjust the path based on your folder structure

const app = express();
const port = process.env.PORT || 3101;

// Connect to MongoDB
const mongoUri = 'mongodb://localhost:27017/ncaa';
let dbClient;
let db;

MongoClient.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    dbClient = client;
    db = client.db('ncaa');
    console.log('Connected to MongoDB');
  })
  .catch(error => console.error('Error connecting to MongoDB:', error));

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Set up the MongoDB client for routes
app.use((req, res, next) => {
  req.dbClient = dbClient;
  req.db = db; // Make sure to attach the db to the request object
  next();
});

// Use the games router
app.use('/api/games', gamesRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
