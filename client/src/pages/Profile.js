import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FaMedal,
  FaTrophy,
  FaChartLine,
  FaHeart,
  FaPlus,
  FaClock,
  FaFire,
  FaStar,
  FaBook,
  FaVideo,
  FaHeadphones,
  FaGamepad,
  FaCog
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Badge from '../components/common/Badge';
import './Profile.css';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('voortgang');

  // Data states
  const [badges, setBadges] = useState([]);
  const [progress, setProgress] = useState([]);
  const [favorites] = useState([]);
  const [stats, setStats] = useState(null);

  // Settings states
  const [showCeoVideo, setShowCeoVideo] = useState(() => {
    const saved = localStorage.getItem('showCeoVideo');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const isOwnProfile = !userId || userId === currentUser?.id?.toString();

  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const targetUserId = userId || currentUser?.id;

      // Fetch all data in parallel
      const [profileRes, badgesRes, progressRes, statsRes] = await Promise.all([
        api.get(`/social/profile/${targetUserId}`),
        api.get(`/badges/user/${targetUserId}`),
        api.get(`/progress${isOwnProfile ? '' : `?userId=${targetUserId}`}`),
        api.get(`/progress/stats${!isOwnProfile ? `?userId=${targetUserId}` : ''}`)
      ]);

      setProfile(profileRes.data.data);
      setBadges(badgesRes.data.data || []);
      setProgress(progressRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Fout bij het laden van profiel');
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (type) => {
    const icons = {
      cursus: <FaBook />,
      video: <FaVideo />,
      podcast: <FaHeadphones />,
      game: <FaGamepad />
    };
    return icons[type] || <FaBook />;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}u ${mins}m` : `${hours}u`;
  };

  const getLevelProgress = () => {
    if (!profile) return 0;
    const currentLevelPoints = (profile.level - 1) * 100;
    const pointsIntoLevel = profile.total_points - currentLevelPoints;
    return (pointsIntoLevel / 100) * 100;
  };

  const handleToggleCeoVideo = (value) => {
    setShowCeoVideo(value);
    localStorage.setItem('showCeoVideo', JSON.stringify(value));

    if (value) {
      // Also reset minimized state when re-enabling
      localStorage.setItem('ceoVideoMinimized', JSON.stringify(false));
      toast.success('CEO welkomstvideo is weer ingeschakeld');
    } else {
      toast.info('CEO welkomstvideo is uitgeschakeld');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Profiel laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="empty-state">
            <h3>Profiel niet gevonden</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="container">
          <div className="profile-header-content">
            {/* Avatar & Basic Info */}
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {profile.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                {profile.is_online && <div className="online-indicator"></div>}
              </div>

              <div className="profile-basic-info">
                <h1 className="profile-name">{profile.name}</h1>
                <p className="profile-email">{profile.email}</p>

                {profile.bio && (
                  <p className="profile-bio">{profile.bio}</p>
                )}

                <div className="profile-meta">
                  <span className="profile-role">
                    {profile.role === 'admin' ? '👑 Admin' :
                     profile.role === 'teacher' ? '👨‍🏫 Docent' : '🎓 Student'}
                  </span>
                  <span className="profile-join-date">
                    <FaClock /> Lid sinds {new Date(profile.created_at).toLocaleDateString('nl-NL', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="profile-stats-cards">
              {/* Level Card */}
              <div className="stat-card level-card">
                <div className="stat-card-icon">
                  <FaTrophy />
                </div>
                <div className="stat-card-content">
                  <div className="stat-label">Level</div>
                  <div className="stat-value">{profile.level}</div>
                  <div className="level-progress-bar">
                    <div
                      className="level-progress-fill"
                      style={{ width: `${getLevelProgress()}%` }}
                    />
                  </div>
                  <div className="stat-sublabel">
                    {profile.total_points} / {profile.level * 100} punten
                  </div>
                </div>
              </div>

              {/* Points Card */}
              <div className="stat-card points-card">
                <div className="stat-card-icon">
                  <FaStar />
                </div>
                <div className="stat-card-content">
                  <div className="stat-label">Totale Punten</div>
                  <div className="stat-value">{profile.total_points}</div>
                  <div className="stat-sublabel">Alle tijd</div>
                </div>
              </div>

              {/* Badges Card */}
              <div className="stat-card badges-card">
                <div className="stat-card-icon">
                  <FaMedal />
                </div>
                <div className="stat-card-content">
                  <div className="stat-label">Badges</div>
                  <div className="stat-value">{badges.length}</div>
                  <div className="stat-sublabel">Verdiend</div>
                </div>
              </div>

              {/* Streak Card */}
              <div className="stat-card streak-card">
                <div className="stat-card-icon">
                  <FaFire />
                </div>
                <div className="stat-card-content">
                  <div className="stat-label">Streak</div>
                  <div className="stat-value">{stats?.current_streak || 0}</div>
                  <div className="stat-sublabel">dagen</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        <div className="container">
          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === 'voortgang' ? 'active' : ''}`}
              onClick={() => setActiveTab('voortgang')}
            >
              <FaChartLine /> Voortgang
            </button>
            <button
              className={`profile-tab ${activeTab === 'badges' ? 'active' : ''}`}
              onClick={() => setActiveTab('badges')}
            >
              <FaMedal /> Badges ({badges.length})
            </button>
            {isOwnProfile && (
              <button
                className={`profile-tab ${activeTab === 'favorieten' ? 'active' : ''}`}
                onClick={() => setActiveTab('favorieten')}
              >
                <FaHeart /> Favorieten
              </button>
            )}
            {isOwnProfile && (
              <button
                className={`profile-tab ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => setActiveTab('content')}
              >
                <FaPlus /> Mijn Content
              </button>
            )}
            {isOwnProfile && (
              <button
                className={`profile-tab ${activeTab === 'instellingen' ? 'active' : ''}`}
                onClick={() => setActiveTab('instellingen')}
              >
                <FaCog /> Instellingen
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="profile-tab-content">
            {/* Voortgang Tab */}
            {activeTab === 'voortgang' && (
              <div className="voortgang-section">
                <div className="section-header">
                  <h2>Leervoortgang</h2>
                  <p className="section-subtitle">
                    Bekijk alle voltooide en lopende leermaterialen
                  </p>
                </div>

                {/* Progress Stats */}
                <div className="progress-stats-grid">
                  <div className="progress-stat-card">
                    <div className="progress-stat-label">Totaal Gestart</div>
                    <div className="progress-stat-value">{stats?.total_started || 0}</div>
                  </div>
                  <div className="progress-stat-card">
                    <div className="progress-stat-label">Voltooid</div>
                    <div className="progress-stat-value success">{stats?.completed || 0}</div>
                  </div>
                  <div className="progress-stat-card">
                    <div className="progress-stat-label">In Behandeling</div>
                    <div className="progress-stat-value primary">{stats?.in_progress || 0}</div>
                  </div>
                  <div className="progress-stat-card">
                    <div className="progress-stat-label">Voltooiingspercentage</div>
                    <div className="progress-stat-value">
                      {stats?.total_started > 0
                        ? Math.round((stats.completed / stats.total_started) * 100)
                        : 0}%
                    </div>
                  </div>
                </div>

                {/* Progress List */}
                <div className="progress-list">
                  {progress.length > 0 ? (
                    progress.map((item) => (
                      <div key={item.id} className="progress-item">
                        <div className="progress-item-icon">
                          {getContentIcon(item.content_type)}
                        </div>

                        <div className="progress-item-content">
                          <div className="progress-item-header">
                            <h4 className="progress-item-title">{item.title}</h4>
                            <span className={`progress-status status-${item.status}`}>
                              {item.status === 'completed' ? '✅ Voltooid' :
                               item.status === 'in_progress' ? '🔄 Bezig' : '⏸️ Niet gestart'}
                            </span>
                          </div>

                          <div className="progress-item-meta">
                            <span className="content-type-badge">
                              {item.content_type}
                            </span>
                            {item.duration && (
                              <span className="duration-badge">
                                <FaClock /> {formatDuration(item.duration)}
                              </span>
                            )}
                            {item.points_reward && (
                              <span className="points-badge">
                                +{item.points_reward} punten
                              </span>
                            )}
                          </div>

                          <div className="progress-bar-container">
                            <div
                              className="progress-bar"
                              style={{ width: `${item.progress_percentage || 0}%` }}
                            />
                          </div>

                          {item.completed_at && (
                            <div className="progress-completed-date">
                              Voltooid op {new Date(item.completed_at).toLocaleDateString('nl-NL')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>Nog geen voortgang</p>
                      <a href="/leermaterialen" className="btn btn-primary">
                        Start met leren
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Badges Tab */}
            {activeTab === 'badges' && (
              <div className="badges-section">
                <div className="section-header">
                  <h2>Mijn Badges</h2>
                  <p className="section-subtitle">
                    Verzamel badges door content te voltooien en uitdagingen aan te gaan
                  </p>
                </div>

                {badges.length > 0 ? (
                  <div className="badges-grid">
                    {badges.map((badge) => (
                      <Badge
                        key={badge.id}
                        badge={badge}
                        size="medium"
                        showProgress={false}
                        locked={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <FaMedal size={64} />
                    <h3>Nog geen badges</h3>
                    <p>Voltooii content en challenges om je eerste badge te verdienen!</p>
                    <a href="/leermaterialen" className="btn btn-primary">
                      Start met leren
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Favorieten Tab */}
            {activeTab === 'favorieten' && isOwnProfile && (
              <div className="favorieten-section">
                <div className="section-header">
                  <h2>Mijn Favorieten</h2>
                  <p className="section-subtitle">
                    Content die je hebt opgeslagen voor later
                  </p>
                </div>

                {favorites.length > 0 ? (
                  <div className="favorites-grid">
                    {favorites.map((item) => (
                      <div key={item.id} className="favorite-card">
                        <div className="favorite-thumbnail">
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt={item.title} />
                          ) : (
                            <div className="thumbnail-placeholder">
                              {getContentIcon(item.content_type)}
                            </div>
                          )}
                        </div>

                        <div className="favorite-content">
                          <h4>{item.title}</h4>
                          <p className="favorite-description">{item.description}</p>

                          <div className="favorite-meta">
                            <span className="content-type-badge">
                              {getContentIcon(item.content_type)} {item.content_type}
                            </span>
                            {item.duration && (
                              <span className="duration-badge">
                                {formatDuration(item.duration)}
                              </span>
                            )}
                          </div>

                          <button className="btn btn-sm btn-primary">
                            Bekijken
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <FaHeart size={64} />
                    <h3>Nog geen favorieten</h3>
                    <p>Voeg content toe aan je favorieten om ze later terug te vinden</p>
                    <a href="/leermaterialen" className="btn btn-primary">
                      Ontdek content
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Mijn Content Tab */}
            {activeTab === 'content' && isOwnProfile && (
              <div className="my-content-section">
                <div className="section-header">
                  <h2>Mijn Toegevoegde Content</h2>
                  <p className="section-subtitle">
                    Content die je hebt aangemaakt of geüpload
                  </p>
                  <button className="btn btn-primary">
                    <FaPlus /> Nieuwe Content Toevoegen
                  </button>
                </div>

                <div className="empty-state">
                  <FaPlus size={64} />
                  <h3>Nog geen eigen content</h3>
                  <p>Deel je eigen leermaterialen met de community</p>
                  <button className="btn btn-primary">
                    <FaPlus /> Content Toevoegen
                  </button>
                </div>
              </div>
            )}

            {/* Instellingen Tab */}
            {activeTab === 'instellingen' && isOwnProfile && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Instellingen</h2>
                  <p className="section-subtitle">
                    Beheer je persoonlijke voorkeuren en instellingen
                  </p>
                </div>

                <div className="settings-groups">
                  {/* Dashboard Settings */}
                  <div className="settings-group">
                    <h3 className="settings-group-title">Dashboard Instellingen</h3>
                    <div className="settings-list">
                      <div className="setting-item">
                        <div className="setting-info">
                          <div className="setting-label">
                            <FaVideo /> CEO Welkomstvideo
                          </div>
                          <div className="setting-description">
                            Toon de CEO welkomstvideo op je dashboard met informatie over het belang van AI-kennis
                          </div>
                        </div>
                        <div className="setting-control">
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={showCeoVideo}
                              onChange={(e) => handleToggleCeoVideo(e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings - Placeholder for future */}
                  <div className="settings-group">
                    <h3 className="settings-group-title">Notificaties</h3>
                    <div className="settings-list">
                      <div className="setting-item">
                        <div className="setting-info">
                          <div className="setting-label">
                            Email Notificaties
                          </div>
                          <div className="setting-description">
                            Ontvang email notificaties over nieuwe content en voortgang
                          </div>
                        </div>
                        <div className="setting-control">
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={true}
                              disabled
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings - Placeholder for future */}
                  <div className="settings-group">
                    <h3 className="settings-group-title">Privacy</h3>
                    <div className="settings-list">
                      <div className="setting-item">
                        <div className="setting-info">
                          <div className="setting-label">
                            Profiel Zichtbaarheid
                          </div>
                          <div className="setting-description">
                            Maak je profiel zichtbaar voor andere gebruikers
                          </div>
                        </div>
                        <div className="setting-control">
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={true}
                              disabled
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
