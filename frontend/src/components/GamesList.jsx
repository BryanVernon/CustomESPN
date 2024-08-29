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

  return (
    <div>
      <h1>College Football Games</h1>
      {error && <div>{error}</div>}
      <ul>
        {games.length === 0 ? (
          <li>No games available</li>
        ) : (
          games.map((game) => (
            <li key={game._id}>
              <a href={game.url} target="_blank" rel="noopener noreferrer">
                {game.teams}
              </a>
              <div>Time: {game.time}</div>
              <div>Network: {game.network}</div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default GameList;
