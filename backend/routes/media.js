import express from 'express';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const games = await req.db.collection('media').find({}).toArray();
    res.json(games);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

export default router;
