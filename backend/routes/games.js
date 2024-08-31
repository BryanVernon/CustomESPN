// routes/games.js
import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const database = req.dbClient.db('ncaa');
    const collection = database.collection('games');
    const games = await collection.find({}).toArray();
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;