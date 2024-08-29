import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import gamesRouter from './routes/games.js'; // Adjust the path based on your folder structure

const app = express();
const port = process.env.PORT || 3100;

// Connect to MongoDB
const mongoUri = 'mongodb://localhost:27017/ncaa';
const dbName = 'ncaa';
let dbClient;

MongoClient.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    dbClient = client;
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
  next();
});

// Routes
app.use('/api/games', gamesRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
