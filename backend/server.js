import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import gamesRouter from './routes/games.js'; // Adjust the path based on your folder structure
import recordsRouter from './routes/records.js'; // Adjust the path based on your folder structure
import rankingsRouter from './routes/rankings.js'; // Adjust the path based on your folder structure
import bettingRouter from './routes/betting.js'; // Adjust the path based on your folder structure
import mediaRouter from './routes/media.js'; // Adjust the path based on your folder structure
import teamsRouter from './routes/teams.js'; // Adjust the path based on your folder structure

const app = express();
const port = process.env.PORT || 3101;

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI;
let dbClient;
let db;

MongoClient.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    dbClient = client;
    db = client.db('ncaa');
    console.log('Connected to MongoDB');

    // Start the server after successful connection
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// Set up the MongoDB client for routes
app.use((req, res, next) => {
  req.dbClient = dbClient;
  req.db = db; // Make sure to attach the db to the request object
  next();
});

// Use the routers
app.use('/api/games', gamesRouter);
app.use('/api/records', recordsRouter);
app.use('/api/rankings', rankingsRouter);
app.use('/api/betting', bettingRouter);
app.use('/api/media', mediaRouter);
app.use('/api/teams', teamsRouter);

// Welcome route
app.get('/', (req, res) => {
  res.send('Welcome to the Custom ESPN API!');
});
