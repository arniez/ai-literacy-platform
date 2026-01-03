import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaTrophy, FaStar, FaMedal, FaFire, FaChartLine, FaUsers, FaCrown, FaAward } from 'react-icons/fa';
import { getAvatarUrl } from '../utils/avatar';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Leaderboard.css';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all-time'); // all-time, this-month, this-week
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/social/leaderboard?limit=50');
      setLeaderboardData(response.data.data || []);

      // Find current user's rank
      const currentUserIndex = response.data.data.findIndex(p => p.id === user?.id);
      if (currentUserIndex !== -1) {
        setUserRank(currentUserIndex + 1);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Fout bij het laden van klassement');
    } finally {
      setLoading(false);
    }
  };

  const getPodiumUsers = () => {
    return leaderboardData.slice(0, 3);
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: '🥇', class: 'gold', title: 'Kampioen' };
    if (rank === 2) return { icon: '🥈', class: 'silver', title: 'Vice-Kampioen' };
    if (rank === 3) return { icon: '🥉', class: 'bronze', title: 'Derde Plaats' };
    if (rank <= 10) return { icon: <FaTrophy />, class: 'top-ten', title: 'Top 10' };
    return { icon: `#${rank}`, class: 'regular', title: `Positie ${rank}` };
  };

  const getProgressToNextLevel = (currentPoints) => {
    const pointsPerLevel = 100; // Adjust based on your leveling system
    return (currentPoints % pointsPerLevel) / pointsPerLevel * 100;
  };

  return (
    <div className="leaderboard-page">
      {/* Hero Section */}
      <div className="leaderboard-hero">
        <div className="container">
          <div className="hero-content-center">
            <FaTrophy className="hero-icon" />
            <h1 className="hero-title">Klassement</h1>
            <p className="hero-subtitle">
              Vergelijk je prestaties met andere studenten en klim naar de top!
            </p>
          </div>

          {/* Stats Overview */}
          <div className="leaderboard-stats">
            <div className="stat-box">
              <FaUsers className="stat-box-icon" />
              <div className="stat-box-content">
                <div className="stat-box-value">{leaderboardData.length}</div>
                <div className="stat-box-label">Actieve Studenten</div>
              </div>
            </div>
            <div className="stat-box">
              <FaFire className="stat-box-icon" />
              <div className="stat-box-content">
                <div className="stat-box-value">
                  {leaderboardData[0]?.total_points || 0}
                </div>
                <div className="stat-box-label">Hoogste Score</div>
              </div>
            </div>
            <div className="stat-box">
              <FaChartLine className="stat-box-icon" />
              <div className="stat-box-content">
                <div className="stat-box-value">
                  {userRank ? `#${userRank}` : '-'}
                </div>
                <div className="stat-box-label">Jouw Positie</div>
              </div>
            </div>
          </div>

          {/* Time Filter */}
          <div className="time-filter">
            <button
              className={`filter-btn ${timeFilter === 'all-time' ? 'active' : ''}`}
              onClick={() => setTimeFilter('all-time')}
            >
              <FaTrophy /> Alle Tijden
            </button>
            <button
              className={`filter-btn ${timeFilter === 'this-month' ? 'active' : ''}`}
              onClick={() => setTimeFilter('this-month')}
              disabled
            >
              <FaMedal /> Deze Maand
            </button>
            <button
              className={`filter-btn ${timeFilter === 'this-week' ? 'active' : ''}`}
              onClick={() => setTimeFilter('this-week')}
              disabled
            >
              <FaFire /> Deze Week
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="leaderboard-content">
        <div className="container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Klassement laden...</p>
            </div>
          ) : (
            <>
              {/* Podium - Top 3 */}
              {getPodiumUsers().length > 0 && (
                <div className="podium-section">
                  <div className="section-header-center">
                    <FaCrown className="section-icon" />
                    <h2>Top 3 Kampioenen</h2>
                  </div>

                  <div className="podium">
                    {/* Second Place */}
                    {getPodiumUsers()[1] && (
                      <div className="podium-place second">
                        <div className="podium-rank-badge silver">
                          <span className="rank-medal">🥈</span>
                          <span className="rank-number">2</span>
                        </div>
                        <div className="podium-avatar">
                          <img
                            src={getAvatarUrl(getPodiumUsers()[1])}
                            alt={getPodiumUsers()[1].name || `${getPodiumUsers()[1].first_name} ${getPodiumUsers()[1].last_name}`}
                          />
                        </div>
                        <h3 className="podium-name">
                          {getPodiumUsers()[1].name || `${getPodiumUsers()[1].first_name} ${getPodiumUsers()[1].last_name}`}
                        </h3>
                        <div className="podium-level">Level {getPodiumUsers()[1].level}</div>
                        <div className="podium-points">
                          <FaStar /> {getPodiumUsers()[1].total_points}
                        </div>
                        <div className="podium-stats">
                          <span>{getPodiumUsers()[1].completed_count || 0} voltooid</span>
                        </div>
                      </div>
                    )}

                    {/* First Place */}
                    {getPodiumUsers()[0] && (
                      <div className="podium-place first">
                        <div className="crown-icon">
                          <FaCrown />
                        </div>
                        <div className="podium-rank-badge gold">
                          <span className="rank-medal">🥇</span>
                          <span className="rank-number">1</span>
                        </div>
                        <div className="podium-avatar">
                          <img
                            src={getAvatarUrl(getPodiumUsers()[0])}
                            alt={getPodiumUsers()[0].name || `${getPodiumUsers()[0].first_name} ${getPodiumUsers()[0].last_name}`}
                          />
                        </div>
                        <h3 className="podium-name">
                          {getPodiumUsers()[0].name || `${getPodiumUsers()[0].first_name} ${getPodiumUsers()[0].last_name}`}
                        </h3>
                        <div className="podium-level">Level {getPodiumUsers()[0].level}</div>
                        <div className="podium-points">
                          <FaStar /> {getPodiumUsers()[0].total_points}
                        </div>
                        <div className="podium-stats">
                          <span>{getPodiumUsers()[0].completed_count || 0} voltooid</span>
                        </div>
                      </div>
                    )}

                    {/* Third Place */}
                    {getPodiumUsers()[2] && (
                      <div className="podium-place third">
                        <div className="podium-rank-badge bronze">
                          <span className="rank-medal">🥉</span>
                          <span className="rank-number">3</span>
                        </div>
                        <div className="podium-avatar">
                          <img
                            src={getAvatarUrl(getPodiumUsers()[2])}
                            alt={getPodiumUsers()[2].name || `${getPodiumUsers()[2].first_name} ${getPodiumUsers()[2].last_name}`}
                          />
                        </div>
                        <h3 className="podium-name">
                          {getPodiumUsers()[2].name || `${getPodiumUsers()[2].first_name} ${getPodiumUsers()[2].last_name}`}
                        </h3>
                        <div className="podium-level">Level {getPodiumUsers()[2].level}</div>
                        <div className="podium-points">
                          <FaStar /> {getPodiumUsers()[2].total_points}
                        </div>
                        <div className="podium-stats">
                          <span>{getPodiumUsers()[2].completed_count || 0} voltooid</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Full Leaderboard Table */}
              <div className="leaderboard-table-section">
                <div className="section-header-center">
                  <FaAward className="section-icon" />
                  <h2>Volledig Klassement</h2>
                </div>

                <div className="leaderboard-table">
                  {leaderboardData.map((player, index) => {
                    const rank = index + 1;
                    const badge = getRankBadge(rank);
                    const isCurrentUser = player.id === user?.id;

                    return (
                      <div
                        key={player.id}
                        className={`leaderboard-row ${badge.class} ${isCurrentUser ? 'current-user' : ''}`}
                      >
                        <div className="rank-cell">
                          <div className={`rank-badge ${badge.class}`}>
                            {typeof badge.icon === 'string' ? (
                              <span className="rank-text">{badge.icon}</span>
                            ) : (
                              badge.icon
                            )}
                          </div>
                          <span className="rank-title">{badge.title}</span>
                        </div>

                        <div className="player-cell">
                          <div className="player-avatar">
                            <img
                              src={getAvatarUrl(player)}
                              alt={player.name || `${player.first_name} ${player.last_name}` || player.username}
                            />
                          </div>
                          <div className="player-info">
                            <div className="player-name">
                              {player.name || `${player.first_name} ${player.last_name}` || player.username}
                              {isCurrentUser && <span className="you-badge">Jij</span>}
                            </div>
                            <div className="player-meta">
                              {player.study_program && (
                                <span className="study-program">{player.study_program}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="stats-cell">
                          <div className="stat-item">
                            <FaStar className="stat-icon" />
                            <span className="stat-value">{player.total_points}</span>
                            <span className="stat-label">Punten</span>
                          </div>
                          <div className="stat-item">
                            <FaTrophy className="stat-icon" />
                            <span className="stat-value">{player.level}</span>
                            <span className="stat-label">Level</span>
                          </div>
                          <div className="stat-item">
                            <FaMedal className="stat-icon" />
                            <span className="stat-value">{player.completed_count || 0}</span>
                            <span className="stat-label">Voltooid</span>
                          </div>
                        </div>

                        <div className="progress-cell">
                          <div className="level-progress">
                            <div className="progress-bar-container">
                              <div
                                className="progress-bar-fill"
                                style={{ width: `${getProgressToNextLevel(player.total_points)}%` }}
                              ></div>
                            </div>
                            <span className="progress-label">
                              {Math.round(getProgressToNextLevel(player.total_points))}% tot Level {player.level + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Motivational Footer */}
              {userRank && userRank > 10 && (
                <div className="motivation-card">
                  <FaChartLine className="motivation-icon" />
                  <h3>Blijf doorleren!</h3>
                  <p>
                    Je staat op positie #{userRank}. Nog {leaderboardData[9]?.total_points - user?.totalPoints || 0} punten
                    tot de Top 10! 🚀
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
