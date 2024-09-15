import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GameList.css'; // Import CSS file for styling

const GameList = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3101/api/games'); // Adjust the URL as needed
        setGames(response.data); // Set the games state with the fetched data
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
                {filteredGames[week][date].map((game) => (
                  <li key={game._id}>
                    <h4>{formatTime(game.start_date)}</h4> {/* Show the time for each game here */}
                    <h5>
                      {game.home_team} {game.home_points !== null ? `(${game.home_points})` : ''} at {game.away_team} {game.away_points !== null ? `(${game.away_points})` : ''}
                    </h5>
                    <p>{game.venue}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default GameList;
