import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvatarUrl } from '../utils/avatar';
import {
  FaFire,
  FaTrophy,
  FaMedal,
  FaStar,
  FaBook,
  FaVideo,
  FaHeadphones,
  FaGamepad,
  FaBriefcase,
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaChartLine,
  FaBell,
  FaUsers,
  FaTimes,
  FaMinus
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    suggestedContent: [],
    basiscursusProgress: [],
    recentActivity: [],
    leaderboard: [],
    stats: null,
    notifications: []
  });
  const [showCeoVideo, setShowCeoVideo] = useState(() => {
    const saved = localStorage.getItem('showCeoVideo');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [ceoVideoMinimized, setCeoVideoMinimized] = useState(() => {
    const saved = localStorage.getItem('ceoVideoMinimized');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCloseCeoVideo = () => {
    setShowCeoVideo(false);
    localStorage.setItem('showCeoVideo', JSON.stringify(false));
  };

  const handleMinimizeCeoVideo = () => {
    const newState = !ceoVideoMinimized;
    setCeoVideoMinimized(newState);
    localStorage.setItem('ceoVideoMinimized', JSON.stringify(newState));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [suggestedRes, progressRes, statsRes, leaderboardRes, notificationsRes] = await Promise.all([
        api.get('/content?limit=6&featured=true'),
        api.get('/progress'),
        api.get('/progress/stats'),
        api.get('/social/leaderboard?limit=10'),
        api.get('/social/notifications?limit=5')
      ]);

      // Get BASIS content - 6 courses tagged as 'basis'
      const basiscursusRes = await api.get('/content?tag=basis');

      setDashboardData({
        suggestedContent: suggestedRes.data.data || [],
        basiscursusProgress: basiscursusRes.data.data || [],
        stats: statsRes.data.data || {},
        leaderboard: leaderboardRes.data.data || [],
        notifications: notificationsRes.data.data || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Fout bij het laden van dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (type) => {
    const icons = {
      cursus: <FaBook />,
      video: <FaVideo />,
      podcast: <FaHeadphones />,
      game: <FaGamepad />,
      praktijkvoorbeeld: <FaBriefcase />,
      artikel: <FaBook />
    };
    return icons[type] || <FaBook />;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}u ${mins}m` : `${hours}u`;
  };

  const calculateBasiscursusProgress = () => {
    if (!dashboardData.basiscursusProgress.length) return 0;
    const completed = dashboardData.basiscursusProgress.filter(
      item => item.userProgress?.status === 'completed'
    ).length;
    return Math.round((completed / dashboardData.basiscursusProgress.length) * 100);
  };

  const getLevelProgress = () => {
    if (!user) return 0;
    const currentLevelPoints = (user.level - 1) * 100;
    const pointsIntoLevel = user.totalPoints - currentLevelPoints;
    return (pointsIntoLevel / 100) * 100;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Dashboard laden...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-left">
              <div className="welcome-section">
                <div className="user-profile-header">
                  <div className="user-avatar-large">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder-large">
                        {(user?.firstName || user?.name)?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="user-info">
                    <h1 className="welcome-title">
                      Welkom terug, {user?.firstName || user?.name}! 👋
                    </h1>
                    <p className="welcome-subtitle">
                      Klaar om je AI-kennis verder te ontwikkelen? Laten we beginnen!
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="quick-stats">
              <div className="stat-card">
                <div className="stat-icon level">
                  <FaTrophy />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Level</div>
                  <div className="stat-value">{user?.level || 1}</div>
                  <div className="stat-progress-bar">
                    <div
                      className="stat-progress-fill"
                      style={{ width: `${getLevelProgress()}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon points">
                  <FaStar />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Punten</div>
                  <div className="stat-value">{user?.totalPoints || 0}</div>
                  <div className="stat-sublabel">Totaal verdiend</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon streak">
                  <FaFire />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Streak</div>
                  <div className="stat-value">{dashboardData.stats?.current_streak || 0}</div>
                  <div className="stat-sublabel">dagen achter elkaar</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon completed">
                  <FaCheckCircle />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Voltooid</div>
                  <div className="stat-value">{dashboardData.stats?.completed || 0}</div>
                  <div className="stat-sublabel">items</div>
                </div>
              </div>
            </div>
            </div>

            {/* CEO Welcome Video */}
            {showCeoVideo && (
              <div className="hero-right">
                <div className={`ceo-welcome-video ${ceoVideoMinimized ? 'minimized' : ''}`}>
                  <div className="video-header">
                    <div className="video-title">
                      <h3>Welkomstboodschap CEO</h3>
                      <p>Waarom AI-kennis belangrijk is</p>
                    </div>
                    <div className="video-controls">
                      <button
                        className="video-control-btn"
                        onClick={handleMinimizeCeoVideo}
                        title={ceoVideoMinimized ? "Uitklappen" : "Inklappen"}
                      >
                        <FaMinus />
                      </button>
                      <button
                        className="video-control-btn"
                        onClick={handleCloseCeoVideo}
                        title="Sluiten"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                  {!ceoVideoMinimized && (
                    <>
                      <div className="video-container">
                        <iframe
                          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                          title="CEO Welcome Message"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                      <div className="video-description">
                        <p>
                          Ontdek waarom AI-literacy essentieel is voor de toekomst.
                          Onze CEO deelt het belang van het begrijpen van AI-technologie
                          in de moderne wereld.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        <div className="container">
          <div className="dashboard-grid">
            {/* Left Column */}
            <div className="dashboard-main">
              {/* Basiscursus Progress */}
              <section className="dashboard-section">
                <div className="section-header">
                  <h2>
                    <FaBook /> AI Basiscursus
                  </h2>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => navigate('/leermaterialen?tab=BASIS')}
                  >
                    Bekijk basis <FaArrowRight />
                  </button>
                </div>

                <div className="basiscursus-overview">
                  <div className="progress-circle-container">
                    <svg className="progress-circle" viewBox="0 0 120 120">
                      <circle
                        className="progress-circle-bg"
                        cx="60"
                        cy="60"
                        r="54"
                      />
                      <circle
                        className="progress-circle-fill"
                        cx="60"
                        cy="60"
                        r="54"
                        style={{
                          strokeDashoffset: 339.292 - (339.292 * calculateBasiscursusProgress()) / 100
                        }}
                      />
                      <text x="60" y="60" className="progress-percentage">
                        {calculateBasiscursusProgress()}%
                      </text>
                      <text x="60" y="75" className="progress-label">
                        Voltooid
                      </text>
                    </svg>
                  </div>

                  <div className="basiscursus-info">
                    <h3>{dashboardData.basiscursusProgress.length} Lessen</h3>
                    <p>
                      Start met de fundamenten van AI en leer de basis concepten kennen
                    </p>
                    <div className="basiscursus-stats">
                      <div className="basiscursus-stat">
                        <FaCheckCircle className="icon-success" />
                        <span>
                          {dashboardData.basiscursusProgress.filter(
                            item => item.userProgress?.status === 'completed'
                          ).length}{' '}
                          voltooid
                        </span>
                      </div>
                      <div className="basiscursus-stat">
                        <FaClock className="icon-primary" />
                        <span>
                          {dashboardData.basiscursusProgress.filter(
                            item => item.userProgress?.status === 'in_progress'
                          ).length}{' '}
                          bezig
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basiscursus Lessons Grid */}
                <div className="lessons-grid">
                  {dashboardData.basiscursusProgress.map((item, index) => (
                    <div
                      key={item.id}
                      className={`lesson-card ${item.userProgress?.status || 'not_started'}`}
                      onClick={() => navigate(`/content/${item.id}`)}
                    >
                      <div className="lesson-number">{index + 1}</div>
                      <div className="lesson-icon">
                        {getContentIcon(item.content_type)}
                      </div>
                      <div className="lesson-content">
                        <h4>{item.title}</h4>
                        <span className="lesson-duration">
                          {formatDuration(item.duration)}
                        </span>
                      </div>
                      {item.userProgress?.status === 'completed' && (
                        <FaCheckCircle className="lesson-complete-icon" />
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Suggested Content */}
              <section className="dashboard-section">
                <div className="section-header">
                  <h2>
                    <FaStar /> Aanbevolen voor jou
                  </h2>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => navigate('/leermaterialen')}
                  >
                    Meer ontdekken <FaArrowRight />
                  </button>
                </div>

                <div className="content-cards-grid">
                  {dashboardData.suggestedContent.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="content-card-mini"
                      onClick={() => navigate(`/content/${item.id}`)}
                    >
                      {item.thumbnail_url ? (
                        <div
                          className="card-mini-thumbnail"
                          style={{ backgroundImage: `url(${item.thumbnail_url})` }}
                        >
                          {item.is_featured && (
                            <span className="featured-badge-mini">⭐</span>
                          )}
                        </div>
                      ) : (
                        <div className="card-mini-thumbnail placeholder">
                          {getContentIcon(item.content_type)}
                          {item.is_featured && (
                            <span className="featured-badge-mini">⭐</span>
                          )}
                        </div>
                      )}
                      <div className="card-mini-content">
                        <h4>{item.title}</h4>
                        <div className="card-mini-meta">
                          <span className="content-type">
                            {getContentIcon(item.content_type)}
                            {item.content_type}
                          </span>
                          <span className="duration">
                            {formatDuration(item.duration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Sidebar */}
            <div className="dashboard-sidebar">
              {/* Notifications */}
              {dashboardData.notifications.length > 0 && (
                <section className="sidebar-section">
                  <div className="section-header-small">
                    <h3>
                      <FaBell /> Berichten
                    </h3>
                  </div>
                  <div className="notifications-list">
                    {dashboardData.notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="notification-item">
                        <div className="notification-icon">
                          <FaBell />
                        </div>
                        <div className="notification-content">
                          <p>{notification.message}</p>
                          <span className="notification-time">
                            {new Date(notification.created_at).toLocaleDateString('nl-NL')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Top 10 Leaderboard */}
              <section className="sidebar-section">
                <div className="section-header-small">
                  <h3>
                    <FaUsers /> Top 10 Klassement
                  </h3>
                  <button
                    className="btn-link"
                    onClick={() => navigate('/leaderboard')}
                  >
                    Volledig klassement
                  </button>
                </div>

                <div className="leaderboard-mini">
                  {dashboardData.leaderboard.map((player, index) => (
                    <div
                      key={player.id}
                      className={`leaderboard-item ${player.id === user?.id ? 'current-user' : ''}`}
                    >
                      <div className="leaderboard-rank">
                        {index === 0 && <span className="rank-medal gold">🥇</span>}
                        {index === 1 && <span className="rank-medal silver">🥈</span>}
                        {index === 2 && <span className="rank-medal bronze">🥉</span>}
                        {index > 2 && <span className="rank-number">#{index + 1}</span>}
                      </div>
                      <div className="leaderboard-avatar">
                        <img
                          src={getAvatarUrl(player)}
                          alt={player.name || `${player.first_name} ${player.last_name}` || player.username}
                        />
                      </div>
                      <div className="leaderboard-info">
                        <span className="leaderboard-name">
                          {player.name || `${player.first_name} ${player.last_name}` || player.username}
                          {player.id === user?.id && <span className="you-badge">Jij</span>}
                        </span>
                        <span className="leaderboard-level">Level {player.level}</span>
                      </div>
                      <div className="leaderboard-points">
                        <FaStar className="points-icon" />
                        {player.total_points}
                      </div>
                    </div>
                  ))}
                </div>

                {!dashboardData.leaderboard.find(p => p.id === user?.id) && (
                  <div className="your-rank">
                    <p>
                      Jouw positie: <strong>Nog niet in top 10</strong>
                    </p>
                    <p className="rank-hint">Blijf leren om hoger te komen! 🚀</p>
                  </div>
                )}
              </section>

              {/* Quick Actions */}
              <section className="sidebar-section">
                <div className="section-header-small">
                  <h3>
                    <FaChartLine /> Snelle Acties
                  </h3>
                </div>
                <div className="quick-actions">
                  <button
                    className="quick-action-btn"
                    onClick={() => navigate('/leermaterialen')}
                  >
                    <FaBook />
                    <span>Verken Leermaterialen</span>
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={() => navigate('/badges')}
                  >
                    <FaMedal />
                    <span>Bekijk Badges</span>
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={() => navigate('/challenges')}
                  >
                    <FaTrophy />
                    <span>Uitdagingen</span>
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={() => navigate(`/profile/${user?.id}`)}
                  >
                    <FaUsers />
                    <span>Mijn Profiel</span>
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
