import 'dotenv/config';
import axios from 'axios';
import { MongoClient } from 'mongodb';

// MongoDB connection information
const mongoUri = process.env.MONGODB_URI;
const dbName = 'ncaa';
const collectionName = 'games';
const recordsCollectionName = 'records';
const rankingsCollectionName = 'rankings';
const bettingCollectionName = 'betting';
const mediaCollectionName = 'media';
const teamsCollectionName = 'teams';

const apiKey = 'TWP+UHEydRUg/wmxx8jEEpxsbkOggGjc7gUousSHei5H8kEl3qSTdU1mzg0PLrz4'; // Replace with your actual API key

async function uploadWeek1GamesToMongoDB() {
  const client = new MongoClient(mongoUri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const recordsCollection = db.collection(recordsCollectionName);
    const rankingsCollection = db.collection(rankingsCollectionName);
    const bettingCollection = db.collection(bettingCollectionName);
    const mediaCollection = db.collection(mediaCollectionName);
    const teamsCollection = db.collection(teamsCollectionName);
    // Clear existing data from the collections
    await collection.deleteMany({});
    console.log("Cleared existing data from games collection");
    
    await recordsCollection.deleteMany({});
    console.log("Cleared existing data from records collection");

    await rankingsCollection.deleteMany({});
    console.log("Cleared existing data from rankings collection");

    await bettingCollection.deleteMany({});
    console.log("Cleared existing data from betting collection");

    await mediaCollection.deleteMany({});
    console.log("Cleared existing data from media collection");

    await teamsCollection.deleteMany({});
    console.log("Cleared existing data from logos collection");
    // Fetch games data
    
    const year = 2024;
    
    const gamesResponse = await axios.get(`https://api.collegefootballdata.com/games`, {
      params: {
        year,
      },
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('Games API called successfully. Returned data:');

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
      console.log("No games found for the specified week.");
    } else {
      // Insert the fetched games data into MongoDB
      const insertResult = await collection.insertMany(gamesData);
      console.log(`Inserted ${insertResult.insertedCount} game documents`);
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

    console.log('Records API called successfully. Returned data:');

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

    // Fetch rankings data
    const rankingsResponse = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings`);
    console.log('Rankings API called successfully. Returned data:');

    // Filter and prepare rankings data for insertion into MongoDB
    const rankingsData = rankingsResponse.data.rankings[0].ranks.map(rank => ({
      current: rank.current,
      previous: rank.previous,
      points: rank.points,
      firstPlaceVotes: rank.firstPlaceVotes || 0,
      trend: rank.trend,
      team: {
        id: rank.team.id,
        location: rank.team.location,
        name: rank.team.name,
        nickname: rank.team.nickname,
        abbreviation: rank.team.abbreviation,
        logo: rank.team.logo,
        recordSummary: rank.team.recordSummary
      },
      date: rank.date,
      lastUpdated: rank.lastUpdated
    }));

    if (rankingsData.length === 0) {
      console.log("No rankings found.");
    } else {
      // Insert the fetched rankings data into MongoDB
      const rankingsInsertResult = await rankingsCollection.insertMany(rankingsData);
      console.log(`Inserted ${rankingsInsertResult.insertedCount} rankings documents`);
    }

    // Fetch betting data
    const bettingResponse = await axios.get(`https://api.collegefootballdata.com/lines`, {
      params: {
        year  // Adjust the week number if needed
      },
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('Betting API called successfully. Returned data:');

    // Filter and prepare betting data for insertion into MongoDB
    const bettingData = bettingResponse.data.map(game => ({
      id: game.id,
      season: game.season,
      week: game.week,
      startDate: game.startDate,
      homeTeam: game.homeTeam,
      homeConference: game.homeConference,
      homeScore: game.homeScore,
      awayTeam: game.awayTeam,
      awayConference: game.awayConference,
      awayScore: game.awayScore,
      lines: game.lines.map(line => ({
        provider: line.provider,
        spread: line.spread,
        formattedSpread: line.formattedSpread,
        overUnder: line.overUnder,
        homeMoneyline: line.homeMoneyline,
        awayMoneyline: line.awayMoneyline
      }))
    }));

    if (bettingData.length === 0) {
      console.log("No betting data found.");
    } else {
      // Insert the fetched betting data into MongoDB
      const bettingInsertResult = await bettingCollection.insertMany(bettingData);
      console.log(`Inserted ${bettingInsertResult.insertedCount} betting documents`);
    }

    // Fetch media data
    const mediaResponse = await axios.get(`https://api.collegefootballdata.com/games/media`, {
      params: {
        year,
      },
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('Media API called successfully. Returned data:');

    // Filter and prepare media data for insertion into MongoDB
    const mediaData = mediaResponse.data.map(media => ({
      gameId: media.id,
      mediaType: media.mediaType,
      outlet: media.outlet
    }));

    if (mediaData.length === 0) {
      console.log("No media data found.");
    } else {
      // Insert the fetched media data into MongoDB
      const mediaInsertResult = await mediaCollection.insertMany(mediaData);
      console.log(`Inserted ${mediaInsertResult.insertedCount} media documents`);
    }
    // Fetch logos data
    const teamsResponse = await axios.get(`https://api.collegefootballdata.com/teams`, {
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    console.log('Logos API called successfully. Returned data:');
    // Filter and prepare logos data for insertion into MongoDB
    const teamsData = teamsResponse.data.map(team => ({
      id: team.id,
      school: team.school,
      mascot: team.mascot,
      logos: team.logos,
      conference: team.conference,

    }));
    if (teamsData.length === 0) {
      console.log("No logos found.");
    } else {
      // Insert the fetched logos data into MongoDB
      const teamsInsertResult = await teamsCollection.insertMany(teamsData);
      console.log(`Inserted ${teamsInsertResult.insertedCount} logos documents`);
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
