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
    let currentWeek = ''; // Variable to hold current week
    let currentDay = ''; // Variable to hold current day

    $('h3').each((index, element) => {
      const weekTitle = $(element).text().trim();
      const isLiveStats = $(element).hasClass('live_stats'); // Check if the <h3> has the class 'live_stats'

      if (isLiveStats) {
        console.log(`Skipping <h3> with class 'live_stats': "${weekTitle}"`);
        return; // Skip to the next <h3> element
      }
      if (weekTitle.startsWith('Week')) {
        currentWeek = weekTitle;
        console.log(`Processing ${weekTitle}`);

        // Get all content after the current <h3> up until the next <h3>
        $(element).nextUntil('h3').each((i, siblingElement) => {
          const pElement = $(siblingElement);
          const anchor = pElement.find('a');

          // Check if the paragraph is a day of the week
          if (pElement.is('p') && anchor.length === 0) {
            currentDay = pElement.text().trim();
            console.log(`Detected day: ${currentDay}`);
          } else {
            // Extract game details
            pElement.find('a').each((index, linkElement) => {
              const teams = $(linkElement).text().trim();
              const url = $(linkElement).attr('href').trim();
              const timeNetworkText = $(linkElement).text().split('|');

              // Filter out non-game entries
              if (!teams.includes('Click or tap here for a live scoreboard')) {
                const time = timeNetworkText[1]?.trim();
                const network = timeNetworkText[2]?.trim();

                // Ensure URL is correctly formed
                const fullUrl = url.startsWith('http') ? url : `https://www.ncaa.com${url}`;

                // Add to games array
                games.push({
                  week: currentWeek,
                  day: currentDay,
                  teams,
                  time,
                  network,
                  url: fullUrl
                });
              }
            });
          }
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
