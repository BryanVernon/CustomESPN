import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GameList.css'; // Import CSS file for styling

const GameList = () => {
  const [games, setGames] = useState([]);
  const [records, setRecords] = useState([]); // Add state for records
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gamesResponse = await axios.get('http://localhost:3101/api/games'); // Adjust the URL as needed
        setGames(gamesResponse.data); // Set the games state with the fetched data
        
        const recordsResponse = await axios.get('http://localhost:3101/api/records'); // Adjust the URL as needed
        setRecords(recordsResponse.data); // Set the records state with the fetched data
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Helper function to format date
  const formatDate = (dateStr) => {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    try {
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  // Helper function to format time
  const formatTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const options = { hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' };
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (e) {
      console.error('Error formatting time:', e);
      return 'Invalid Time';
    }
  };

  // Group games by week and day
  const groupedGames = games.reduce((acc, game) => {
    const week = `Week ${game.week || 'N/A'}`;
    const date = formatDate(game.start_date);
    const key = `${week}-${date}`;

    if (!acc[week]) {
      acc[week] = {};
    }

    if (!acc[week][date]) {
      acc[week][date] = [];
    }

    acc[week][date].push(game);

    return acc;
  }, {});

  // Filter games by selected week
  const filteredGames = selectedWeek === 'All'
    ? groupedGames
    : { [`Week ${selectedWeek}`]: groupedGames[`Week ${selectedWeek}`] };

  return (
    <div className="game-list">
      <h1>College Schedule</h1>
      <div className="filter">
        <label htmlFor="week-select">Filter by Week:</label>
        <select
          id="week-select"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
        >
          <option value="All">All</option>
          {[...Array(12)].map((_, index) => (
            <option key={index} value={index + 1}>
              Week {index + 1}
            </option>
          ))}
        </select>
      </div>
      {Object.keys(filteredGames).map((week) => (
        <div key={week} className="game-week">
          <h2>{week}</h2>
          {Object.keys(filteredGames[week]).map((date) => (
            <div key={date} className="game-day">
              <h3>{date}</h3>
              <ul>
                {filteredGames[week][date].map((game) => {
                  const homeRecord = records.find(record => record.team === game.home_team) || {};
                  const awayRecord = records.find(record => record.team === game.away_team) || {};

                  // Determine the bold score
                  const homeScore = game.home_points;
                  const awayScore = game.away_points;
                  const isHomeTeamWinning = homeScore > awayScore;
                  const homeScoreDisplay = isHomeTeamWinning ? <strong>{homeScore}</strong> : homeScore;
                  const awayScoreDisplay = !isHomeTeamWinning ? <strong>{awayScore}</strong> : awayScore;

                  return (
                    <li key={game._id}>
                      <h4>{formatTime(game.start_date)}</h4> {/* Show the time for each game here */}
                      <h5>
                        {game.home_team} ({homeRecord.wins || 0}-{homeRecord.losses || 0}) 
                        at {game.away_team} ({awayRecord.wins || 0}-{awayRecord.losses || 0})
                      </h5>
                      {homeScore !== null && awayScore !== null ? (
                        <p>
                          Final Score: {game.home_team} {homeScoreDisplay} {game.away_team} {awayScoreDisplay}
                        </p>
                      ) : null}
                      <p>{game.venue}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default GameList;
