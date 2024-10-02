import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GameList.css'; // Import CSS file for styling
import placeholderImage from '../assets/placeholder.png';
const GameList = () => {
  const [games, setGames] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState('All');
  const [rankings, setRankings] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [conference, setConference] = useState('All');
  const [bettingData, setBettingData] = useState([]);
  const [mediaData, setMediaData] = useState([]);
  const [teamsData, setTeamsData] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [top25Teams, setTop25Teams] = useState([]);

  const conferences = ['AP Top 25', 'SEC', 'ACC', 'Big 12', 'Big Ten', 'Mountain West', 'Pac-12', 'FBS Independents', 'Mid-American','Sun Belt', 'Ivy', 'Patriot'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gamesResponse = await axios.get('https://customespn.onrender.com/api/games');
        const teamsResponse = await axios.get('https://customespn.onrender.com/api/teams');
        console.log(teamsResponse.data);
        setTeamsData(teamsResponse.data);

        const filteredGames = gamesResponse.data.filter(game => {
          const homeTeamConf = teamsResponse.data.find(team => team.school === game.home_team)?.conference;
          const awayTeamConf = teamsResponse.data.find(team => team.school === game.away_team)?.conference;
          return conferences.includes(homeTeamConf) || conferences.includes(awayTeamConf);
        });

        setGames(filteredGames);

        const recordsResponse = await axios.get('https://customespn.onrender.com/api/records');
        setRecords(recordsResponse.data);

        const rankingsResponse = await axios.get('https://customespn.onrender.com/api/rankings');
        setRankings(rankingsResponse.data);
        const teamLocations = rankingsResponse.data.map(ranking => ranking.team.location);
        setTop25Teams(teamLocations);
        setFilteredTeams(teamsResponse.data.filter(team => teamLocations.includes(team.school)));

        const bettingResponse = await axios.get('https://customespn.onrender.com/api/betting');
        setBettingData(bettingResponse.data);

        const mediaResponse = await axios.get('https://customespn.onrender.com/api/media');
        setMediaData(mediaResponse.data);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const startOfSeason = new Date('2024-08-24'); // Replace with actual start date of the season
    const today = new Date();
    const getNextMonday = (date) => {
      const dayOfWeek = date.getDay(); // Get the day of the week (0 = Sunday, 6 = Saturday)
      const daysUntilMonday = (8 - dayOfWeek) % 7; // Calculate how many days until the next Monday
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysUntilMonday);
    };
  
    // Get the date of the first Monday of the season
    const firstMonday = getNextMonday(startOfSeason);
  
    // Calculate the difference in time between today and the first Monday
    const diffInTime = today.getTime() - firstMonday.getTime();
    const diffInDays = Math.floor((diffInTime/ (1000 * 3600 * 24)));
  
    // Calculate the number of full weeks (Mondays) that have passed since the first Monday
    const currentWeek = Math.floor(diffInDays / 7) + 1;

    setSelectedWeek(currentWeek);
  }, []);

  

  useEffect(() => {
    const initialFilteredTeams = teamsData.filter(team =>
      conferences.includes(team.conference)
    );
    setFilteredTeams(initialFilteredTeams);
  }, [teamsData]);

  useEffect(() => {
    if (conference === 'All') {
      setFilteredTeams(teamsData.filter(team => conferences.includes(team.conference)));
      setSelectedTeam('All'); // Reset selected team when conference changes
    } else if (conference === 'AP Top 25') {
      const filteredTop25 = teamsData.filter(team => top25Teams.includes(team.school));
      setFilteredTeams(filteredTop25);
      setSelectedTeam('All'); // Reset selected team when conference changes
    } else {
      const filteredConferenceTeams = teamsData.filter(team => team.conference === conference);
      setFilteredTeams(filteredConferenceTeams);
      setSelectedTeam('All'); // Reset selected team when conference changes
    }
  }, [conference, teamsData, top25Teams]);
  
  

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
      ranking.team.location === teamName || ranking.team.nickname === teamName
    );
    return teamRanking ? `#${teamRanking.current}` : '';
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
        const isTop25Game = top25Teams.includes(game.home_team) || top25Teams.includes(game.away_team);
        const isWeekMatch = selectedWeek === 'All' || week === `Week ${selectedWeek}`;
        const isConferenceMatch = conference === 'All' || 
                                  (conference === 'AP Top 25' && (game.home_team === selectedTeam || game.away_team === selectedTeam)) ||
                                  (conference === 'AP Top 25' && isTop25Game) ||
                                  teamsData.find(team => team.school === game.home_team)?.conference === conference || 
                                  teamsData.find(team => team.school === game.away_team)?.conference === conference;

        const isTeamMatch = selectedTeam === 'All' || game.home_team === selectedTeam || game.away_team === selectedTeam;

        return isWeekMatch && isConferenceMatch && isTeamMatch;
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

  // Sort filteredTeams based on ranking
  const sortedFilteredTeams = filteredTeams.sort((a, b) => {
    const rankA = rankings.find(r => r.team.location === a.school)?.current || Infinity;
    const rankB = rankings.find(r => r.team.location === b.school)?.current || Infinity;
    return rankA - rankB; // Ascending order
  });

  return (
    <div className="game-list">
      <h1>College Football Schedule</h1>
      <div className="filter-container">
        <div className="week-filter">
          <label htmlFor="week-select">Week: </label>
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
        <div className='filter'>
          <div className="conference-filter">
            <label htmlFor="conference-select">Conference:</label>
            <select
              id="conference-select"
              value={conference}
              onChange={(e) => setConference(e.target.value)}
            >
              <option value="All">All Conferences</option>
              {conferences.map((conf, index) => (
                <option key={index} value={conf}>{conf}</option>
              ))}
            </select>
          </div>

          <div className="team-filter">
            <label htmlFor="team-select">Team:</label>
            <select
              id="team-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="All">All Teams</option>
              {sortedFilteredTeams.map((team, index) => {
                const teamRanking = getTeamRanking(team.school);
                return (
                  <option key={index} value={team.school}>
                    {teamRanking} {team.school}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
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
                  const homeScore = game.home_points !== undefined ? game.home_points : null; // Change to null
                  const awayScore = game.away_points !== undefined ? game.away_points : null; // Change to null
                  const media = mediaData.find(media => media.gameId === game.id) || {};
                  const homeTeamData = teamsData.find(team => team.school === game.home_team);
                  const awayTeamData = teamsData.find(team => team.school === game.away_team);

                  // Check if final scores are available
                  const isFinalScoreAvailable = homeScore !== null && awayScore !== null;
                  const spreadDisplay = formattedSpread && <p>{formattedSpread}</p>;
                  const overUnderDisplay = overUnder !== null && <p>Over/Under: {overUnder}</p>;
                  return (
                    <li key={game._id}>
                      {isFinalScoreAvailable ? (
                        <div className="final-score-container">
                          <div className="team-info-left">
                            <div className="team-logo">
                              <img 
                                src={awayTeamData?.logos?.[0] || placeholderImage} 
                                alt={`${game.away_team} logo`} 
                              />
                            </div>
                            <div className="team-details">
                              <div className="team-name">{getTeamRanking(game.away_team)} {game.away_team}</div>
                              <div className="team-record">{awayRecord.wins || 0}-{awayRecord.losses || 0}</div>
                            </div>
                            </div>
                            <div className={`team-score-away ${awayScore > homeScore ? 'large-score' : 'small-score'}`}>
          <strong>{awayScore}</strong>
        </div>                          

                          <div className="vs">at</div>

                          
                          <div className={`team-score-home ${homeScore > awayScore ? 'large-score' : 'small-score'}`}>
          <strong>{homeScore}</strong>
        </div>                            <div className="team-info-right">
                            <div className="team-logo">
                              <img 
                                src={homeTeamData?.logos?.[0] || placeholderImage} 
                                alt={`${game.home_team} logo`} 
                              />
                            </div>
                            <div className="team-details">
                              <div className="team-name">{getTeamRanking(game.home_team)} {game.home_team}</div>
                              <div className="team-record">{homeRecord.wins || 0}-{homeRecord.losses || 0}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="game-info">
                          <div className="game-details game-details-left">
                            <div className="team-info">
                              <span className="team-logo">
                                <img 
                                  src={awayTeamData?.logos?.[0] || placeholderImage} 
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
                                  src={homeTeamData?.logos?.[0] || placeholderImage} 
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
                      )}
                      {(formattedSpread || overUnder) && (
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