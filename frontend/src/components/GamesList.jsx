import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GameList.css'; // Import CSS file for styling

const GameList = () => {
  const [games, setGames] = useState([]);
  const [records, setRecords] = useState([]); // Add state for records
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState('All');
  const [rankings, setRankings] = useState([]);
  const [filterType, setFilterType] = useState('All'); // Add state for filter type

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gamesResponse = await axios.get('http://localhost:3101/api/games'); // Adjust the URL as needed
        setGames(gamesResponse.data); // Set the games state with the fetched data
        
        const recordsResponse = await axios.get('http://localhost:3101/api/records'); // Adjust the URL as needed
        setRecords(recordsResponse.data); // Set the records state with the fetched data
        
        const rankingsResponse = await axios.get('http://localhost:3101/api/rankings'); // Adjust the URL as needed
        setRankings(rankingsResponse.data); // Set the rankings state with the fetched data
      
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

  // Function to get team ranking by team name
  const getTeamRanking = (teamName) => {
    const teamRanking = rankings.find((ranking) =>
      ranking.team.name === teamName || ranking.team.nickname === teamName
    );
    if (teamRanking) {
      return `#${teamRanking.current}`;
    }
    return ''; // Return empty string if no ranking found
  };

  // Function to check if either team is ranked in Top 25
  const isRanked = (homeTeam, awayTeam) => {
    return getTeamRanking(homeTeam) || getTeamRanking(awayTeam);
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

  // Filter games by selected week and filter type
  const filteredGames = Object.keys(groupedGames).reduce((acc, week) => {
    const days = groupedGames[week];
    const filteredDays = Object.keys(days).reduce((dayAcc, date) => {
      const gamesList = days[date].filter((game) => {
        const isTexasGame = game.home_team === 'Texas' || game.away_team === 'Texas';
        const isTop25Game = filterType === 'Top 25' ? isRanked(game.home_team, game.away_team) : true;
        const isWeekMatch = selectedWeek === 'All' || week === `Week ${selectedWeek}`;

        return isWeekMatch && (filterType === 'Texas' ? isTexasGame : isTop25Game);
      });
      if (gamesList.length > 0) {
        dayAcc[date] = gamesList;
      }
      return dayAcc;
    }, {});
    if (Object.keys(filteredDays).length > 0) {
      acc[week] = filteredDays;
    }
    return acc;
  }, {});

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
        <label htmlFor="filter-select">Filter by Type:</label>
        <select
          id="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="All">All Games</option>
          <option value="Top 25">Top 25 Games</option>
          <option value="Texas">Texas Games</option>
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
                        {getTeamRanking(game.home_team)} {game.home_team} ({homeRecord.wins || 0}-{homeRecord.losses || 0}) 
                        vs {getTeamRanking(game.away_team)} {game.away_team} ({awayRecord.wins || 0}-{awayRecord.losses || 0})
                      </h5>
                      {homeScore !== null && awayScore !== null ? (
                        <p>
                          Final Score: {game.home_team} {homeScoreDisplay} vs {game.away_team} {awayScoreDisplay}
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
