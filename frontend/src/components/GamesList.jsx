import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GameList.css'; // Import CSS file for styling

const GameList = () => {
  const [games, setGames] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState('All');
  const [rankings, setRankings] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [bettingData, setBettingData] = useState([]);
  const [mediaData, setMediaData] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const gamesResponse = await axios.get('http://localhost:3101/api/games');
        setGames(gamesResponse.data);
        
        const recordsResponse = await axios.get('http://localhost:3101/api/records');
        setRecords(recordsResponse.data);
        
        const rankingsResponse = await axios.get('http://localhost:3101/api/rankings');
        setRankings(rankingsResponse.data);
      
        const bettingResponse = await axios.get('http://localhost:3101/api/betting');
        setBettingData(bettingResponse.data);
        const mediaResponse = await axios.get('http://localhost:3101/api/media');
        setMediaData(mediaResponse.data);
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

  const formatDate = (dateStr) => {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    try {
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  const formatTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const options = { hour: '2-digit', minute: '2-digit', hour12: true };
      return date.toLocaleString(undefined, options);
    } catch (e) {
      console.error('Error formatting time:', e);
      return 'Invalid Time';
    }
  };
  

  const getTeamRanking = (teamName) => {
    const teamRanking = rankings.find((ranking) =>
      ranking.team.name === teamName || ranking.team.nickname === teamName
    );
    if (teamRanking) {
      return `#${teamRanking.current}`;
    }
    return '';
  };

  const isRanked = (homeTeam, awayTeam) => {
    return getTeamRanking(homeTeam) || getTeamRanking(awayTeam);
  };

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
                  const betting = bettingData.find(bet => bet.id === game.id) || {};
                  const formattedSpread = betting.lines && betting.lines.length > 0 ? betting.lines[0].formattedSpread : null;
                  const overUnder = betting.lines && betting.lines.length > 0 ? betting.lines[0].overUnder : null;
                  const homeScore = game.home_points !== undefined ? game.home_points : 'N/A';
                  const awayScore = game.away_points !== undefined ? game.away_points : 'N/A';
                  const media = mediaData.find(media => media.gameId === game.id) || {};

                  // Determine if the home or away score should be bolded
                  const homeScoreDisplay = (homeScore !== 'N/A' && awayScore !== 'N/A' && homeScore > awayScore)
                    ? <strong>{homeScore}</strong>
                    : homeScore;

                  const awayScoreDisplay = (homeScore !== 'N/A' && awayScore !== 'N/A' && awayScore > homeScore)
                    ? <strong>{awayScore}</strong>
                    : awayScore;

                  // Only show final score if both home and away scores are not 'N/A'
                  const finalScoreDisplay = (homeScore !== 'N/A' && awayScore !== 'N/A' && homeScore !== null && awayScore !== null) && (
                    <p>
                      Final Score: {getTeamRanking(game.home_team)} {game.home_team} {homeScoreDisplay} vs {getTeamRanking(game.away_team)} {game.away_team} {awayScoreDisplay}
                    </p>
                  );
                  // Adjust spread for display
                  const spreadDisplay = formattedSpread && <p>Spread: {formattedSpread}</p>;
                  // Over/Under display
                  const overUnderDisplay = overUnder !== null && <p>Over/Under: {overUnder}</p>;

                  return (
                    <li key={game._id}>
                      <h4>{formatTime(game.start_date)}</h4>
                      <h5>
                        {getTeamRanking(game.away_team)} {game.away_team} 
                        {(awayRecord.wins > 0 || awayRecord.losses > 0) && ` (${awayRecord.wins || 0}-${awayRecord.losses || 0}) `} 
                        {''} at {getTeamRanking(game.home_team)} {game.home_team} 
                        {(homeRecord.wins > 0 || homeRecord.losses > 0) && ` (${homeRecord.wins || 0}-${homeRecord.losses || 0})`}
                      </h5>


                      {finalScoreDisplay}
                      <p>{game.venue}</p>
                      {spreadDisplay}
                      {overUnderDisplay}
                      {media.outlet && (
                        <div className="media-info">
                          <p><strong>Outlet:</strong> {media.outlet}</p>
                        </div>
                      )}
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
