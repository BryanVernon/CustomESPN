import axios from 'axios';
import * as cheerio from 'cheerio';
import { MongoClient } from 'mongodb';

// MongoDB connection details
const uri = 'mongodb://localhost:27017';
const dbName = 'ncaa';
const collectionName = 'games';

async function scrapeGames() {
  try {
    console.log('Fetching the page...');
    // Fetch the page
    const { data } = await axios.get('https://www.ncaa.com/news/football/article/college-football-tv-schedule-game-times-preview');
    console.log('Page fetched successfully');

    const $ = cheerio.load(data);

    // Array to hold scraped game data
    const games = [];
    
    console.log('Processing data...');
    // Extract game information
    $('p a').each((index, element) => {
      const teams = $(element).text().trim();
      const url = $(element).attr('href').trim();
      const timeNetworkText = $(element).text().split('|');

      // Filter out non-game entries
      if (!teams.includes('Click or tap here for a live scoreboard')) {
        const time = timeNetworkText[1]?.trim();
        const network = timeNetworkText[2]?.trim();

        // Ensure URL is correctly formed
        const fullUrl = url.startsWith('http') ? url : `https://www.ncaa.com${url}`;

        // Add to games array
        games.push({
          teams,
          time,
          network,
          url: fullUrl
        });
      }
    });

    console.log(`Found ${games.length} games`);

    // Connect to MongoDB and insert data
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Clear previous data (optional)
    await collection.deleteMany({});
    console.log('Cleared previous data');

    // Insert new data
    await collection.insertMany(games);
    console.log('Games successfully scraped and stored.');

    await client.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

scrapeGames();