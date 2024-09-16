import axios from 'axios';
import { MongoClient } from 'mongodb';

// MongoDB connection information
const uri = 'mongodb://localhost:27017';
const dbName = 'ncaa';
const collectionName = 'games';
const recordsCollectionName = 'records';

const apiKey = 'TWP+UHEydRUg/wmxx8jEEpxsbkOggGjc7gUousSHei5H8kEl3qSTdU1mzg0PLrz4'; // Replace with your actual API key

async function uploadWeek1GamesToMongoDB() {
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const recordsCollection = db.collection(recordsCollectionName);

    // Clear existing data from the collections
    await collection.deleteMany({});
    console.log("Cleared existing data from games collection");
    
    await recordsCollection.deleteMany({});
    console.log("Cleared existing data from records collection");

    // Fetch games data
    const year = 2024;
    const division = 'fbs';
    
    const gamesResponse = await axios.get(`https://api.collegefootballdata.com/games`, {
      params: {
        year,
        division
      },
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('Games API called successfully. Returned data:', gamesResponse.data);

    // Filter and prepare data for insertion into MongoDB
    const gamesData = gamesResponse.data.map(game => ({
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
      console.log("No FBS games found for the specified week.");
    } else {
      // Insert the fetched games data into MongoDB
      const insertResult = await collection.insertMany(gamesData);
      console.log(`Inserted ${insertResult.insertedCount} FBS game documents`);
    }

    // Fetch records data
    const recordsResponse = await axios.get(`https://api.collegefootballdata.com/records`, {
      params: {
        year 
      },
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('Records API called successfully. Returned data:', recordsResponse.data);

    // Filter and prepare records data for insertion into MongoDB
    const recordsData = recordsResponse.data.map(record => ({
      year: record.year,
      teamId: record.teamId,
      team: record.team,
      wins: record.total.wins,
      losses: record.total.losses,
      ties: record.total.ties
    }));

    if (recordsData.length === 0) {
      console.log("No records found.");
    } else {
      // Insert the fetched records data into MongoDB
      const recordsInsertResult = await recordsCollection.insertMany(recordsData);
      console.log(`Inserted ${recordsInsertResult.insertedCount} records documents`);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    // Close the MongoDB connection
    await client.close();
  }
}

// Call the function to upload Week 1 games and records
uploadWeek1GamesToMongoDB();
