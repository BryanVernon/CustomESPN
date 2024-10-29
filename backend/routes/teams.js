// routes/games.js
import express from 'express';
import { fetchRecords } from '../utils/dbUtils.js'; // Adjust the path as necessary

const router = express.Router();

// Route to get all games from the 'games' collection
router.get('/', fetchRecords('teams'));

export default router;