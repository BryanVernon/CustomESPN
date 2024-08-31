import React, { useEffect, useState } from 'react';
import axios from 'axios';

const GameList = () => {
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await axios.get('http://localhost:3100/api/games');
        console.log('Fetched games:', response.data); // Debugging line
        setGames(response.data);
      } catch (error) {
        console.error('Error fetching games:', error);
        setError('Failed to load games.');
      }
    };

    fetchGames();
  }, []);

  // Group games by week
  const gamesByWeek = games.reduce((acc, game) => {
    // Ensure week and day information are included in the grouping
    if (!acc[game.week]) {
      acc[game.week] = { day: game.day || 'Unknown', games: [] };
    }
    acc[game.week].games.push(game);
    return acc;
  }, {});

  return (
    <div>
      <h1>College Football Games</h1>
      {error && <div>{error}</div>}
      {Object.keys(gamesByWeek).length === 0 ? (
        <p>No games available</p>
      ) : (
        Object.keys(gamesByWeek).map((week) => (
          <div key={week}>
            <h3>{week}</h3> {/* Display the week */}
            <h4>{gamesByWeek[week].day || 'No Day Available'}</h4> {/* Display the day */}
            <ul>
              {gamesByWeek[week].games.map((game) => (
                <li key={game.url}> {/* Use URL as key to ensure uniqueness */}
                  <a href={game.url} target="_blank" rel="noopener noreferrer">
                    {game.teams}
                  </a>
                  <div>Time: {game.time}</div>
                  <div>Network: {game.network}</div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

export default GameList;
