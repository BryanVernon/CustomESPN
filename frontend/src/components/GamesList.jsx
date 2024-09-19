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
  const [teamsData, setTeamsData] = useState([]);

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
        
        const teamsResponse = await axios.get('http://localhost:3101/api/teams');
        setTeamsData(teamsResponse.data);
        
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
    return teamRanking ? `#${teamRanking.current}` : '';
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
      <h1>College Football Schedule</h1>
      <div className="filter">
        <label htmlFor="week-select">Filter by Week: </label>
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
        <label htmlFor="filter-select"> Filter by Type: </label>
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
            <div key={date} className="game-card">
              <h3 className="game-date">{date}</h3>
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
                  const homeTeamData = teamsData.find(team => team.school === game.home_team);
                  const awayTeamData = teamsData.find(team => team.school === game.away_team);

                  const homeScoreDisplay = (homeScore !== 'N/A' && awayScore !== 'N/A' && homeScore > awayScore)
                    ? <strong>{homeScore}</strong>
                    : homeScore;

                  const awayScoreDisplay = (homeScore !== 'N/A' && awayScore !== 'N/A' && awayScore > homeScore)
                    ? <strong>{awayScore}</strong>
                    : awayScore;

                  const finalScoreDisplay = (homeScore !== 'N/A' && awayScore !== 'N/A' && homeScore !== null && awayScore !== null) && (
                    <p>
                      Final Score: {getTeamRanking(game.home_team)} {game.home_team} {homeScoreDisplay} vs {getTeamRanking(game.away_team)} {game.away_team} {awayScoreDisplay}
                    </p>
                  );

                  const spreadDisplay = formattedSpread && <p>Spread: {formattedSpread}</p>;
                  const overUnderDisplay = overUnder !== null && <p>Over/Under: {overUnder}</p>;

                  return (
                    <li key={game._id}>
                      <div className="game-info">
                        <div className="game-details game-details-left">
                          <div className="team-info">
                            <span className="team-logo">
                              <img 
                                src={awayTeamData?.logos?.[0] || 'placeholder.png'} 
                                alt={`${game.away_team} logo`} 
                              />
                            </span>
                            <span className="team-name">
                              {getTeamRanking(game.away_team)} {game.away_team}
                            </span>
                            <span className="team-record">
                              {(awayRecord.wins > 0 || awayRecord.losses > 0) && ` (${awayRecord.wins || 0}-${awayRecord.losses || 0})`}
                            </span>
                          </div>
                          <div className="team-info">
                            <span className="team-logo">
                              <img 
                                src={homeTeamData?.logos?.[0] || 'placeholder.png'} 
                                alt={`${game.home_team} logo`} 
                              />
                            </span>
                            <span className="team-name">
                              at {getTeamRanking(game.home_team)} {game.home_team}
                            </span>
                            <span className="team-record">
                              {(homeRecord.wins > 0 || homeRecord.losses > 0) && ` (${homeRecord.wins || 0}-${homeRecord.losses || 0})`}
                            </span>
                          </div>
                        </div>
                        <div className="game-details game-details-right">
                          <h4>{formatTime(game.start_date)}</h4>
                          <p>{game.venue}</p>
                          {media.outlet && (
                            <div className="media-info">
                              <p>Outlet: {media.outlet}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {finalScoreDisplay}
                      {(spreadDisplay || overUnderDisplay) && (
                        <div className="betting-card">
                          <div className="betting-info">
                            <p><strong>Betting Lines:</strong></p>
                            {spreadDisplay} {overUnderDisplay}
                          </div>
                        </div>
                      )}
                      <div className="game-separator"></div>
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
