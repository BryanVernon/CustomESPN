import axios from 'axios';
import { MongoClient } from 'mongodb';

// MongoDB connection information
const uri = 'mongodb://localhost:27017';
const dbName = 'ncaa';
const collectionName = 'games';

const apiKey = 'TWP+UHEydRUg/wmxx8jEEpxsbkOggGjc7gUousSHei5H8kEl3qSTdU1mzg0PLrz4'; // Replace with your actual API key

async function uploadWeek1GamesToMongoDB() {
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Clear existing data from the collection
    await collection.deleteMany({});
    console.log("Cleared existing data from collection");

    // API request using axios
    const year = 2024;
    const division = 'fbs';
    
    const response = await axios.get(`https://api.collegefootballdata.com/games`, {
      params: {
        year,
        division
      },
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('API called successfully. Returned data:', response.data);

    // Filter and prepare data for insertion into MongoDB
    const gamesData = response.data.map(game => ({
      id: game.id,
      season: game.season,
      week: game.week,
      start_date: game.start_date,
      venue: game.venue ? game.venue : null,
      home_team: game.home_team ? game.home_team : null,
      home_points: game.home_points,
      away_team: game.away_team ? game.away_team : null,
      away_points: game.away_points,
    }));

    if (gamesData.length === 0) {
      console.log("No FBS games found for Week 4.");
    } else {
      // Insert the fetched games data into MongoDB
      const insertResult = await collection.insertMany(gamesData);
      console.log(`Inserted ${insertResult.insertedCount} FBS game documents`);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    // Close the MongoDB connection
    await client.close();
  }
}

// Call the function to upload Week 4 games
uploadWeek1GamesToMongoDB();
