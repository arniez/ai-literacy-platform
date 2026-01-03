import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaEye, FaClock, FaBook, FaVideo, FaHeadphones, FaGamepad, FaBriefcase, FaPlay, FaCheck, FaExternalLinkAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import ContentViewer from '../components/common/ContentViewer';
import './ContentView.css';

const ContentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/content/${id}`);
      setContent(response.data.data);
      setUserProgress(response.data.data.userProgress);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Fout bij het laden van content');
      navigate('/leermaterialen');
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
    if (minutes < 60) return `${minutes} minuten`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} uur ${mins} min` : `${hours} uur`;
  };

  const handleStartContent = async () => {
    try {
      await api.post(`/progress/${id}`, {
        status: 'in_progress',
        progressPercentage: 0
      });

      // Open content viewer
      setShowViewer(true);

      toast.success('Content gestart! Veel leerplezier.');
      fetchContent(); // Refresh progress
    } catch (error) {
      console.error('Error starting content:', error);
      toast.error('Fout bij het starten van content');
    }
  };

  const handleOpenViewer = () => {
    setShowViewer(true);
  };

  const handleCompleteContent = async () => {
    try {
      const response = await api.post(`/progress/${id}`, {
        status: 'completed',
        progressPercentage: 100
      });

      toast.success(`Content voltooid! Je hebt ${response.data.pointsAwarded || 0} punten verdiend! 🎉`);
      fetchContent(); // Refresh progress
    } catch (error) {
      console.error('Error completing content:', error);
      toast.error('Fout bij het voltooien van content');
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast.error('Selecteer een rating');
      return;
    }

    try {
      setSubmittingRating(true);
      await api.post(`/content/${id}/rate`, {
        rating,
        reviewText: reviewText.trim() || null
      });

      toast.success('Bedankt voor je beoordeling!');
      setRating(0);
      setReviewText('');
      fetchContent(); // Refresh to show new rating
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Fout bij het verzenden van beoordeling');
    } finally {
      setSubmittingRating(false);
    }
  };

  const renderStars = (avgRating, count, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = interactive ? i <= (hoverRating || rating) : i <= Math.floor(avgRating);
      const halfFilled = !interactive && i === Math.ceil(avgRating) && avgRating % 1 >= 0.5;

      stars.push(
        <FaStar
          key={i}
          className={`star ${filled ? 'filled' : ''} ${halfFilled ? 'half-filled' : ''} ${interactive ? 'interactive' : ''}`}
          onClick={interactive ? () => setRating(i) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        />
      );
    }
    return (
      <div className="stars-container">
        {stars}
        {!interactive && count > 0 && <span className="rating-count">({count})</span>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Content laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="empty-state">
            <h3>Content niet gevonden</h3>
            <button className="btn btn-primary" onClick={() => navigate('/leermaterialen')}>
              Terug naar Leermaterialen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCompleted = userProgress?.status === 'completed';
  const isInProgress = userProgress?.status === 'in_progress';

  return (
    <div className="content-view-page">
      {/* Content Viewer Modal */}
      {showViewer && (
        <ContentViewer
          content={content}
          onClose={() => setShowViewer(false)}
        />
      )}

      {/* Hero Section */}
      <div className="content-hero">
        <div className="container">
          <button className="back-button" onClick={() => navigate('/leermaterialen')}>
            <FaArrowLeft /> Terug naar Leermaterialen
          </button>

          <div className="hero-content">
            <div className="content-badges">
              <span className="content-type-badge">
                {getContentIcon(content.content_type)}
                {content.content_type}
              </span>
              {content.difficulty && (
                <span className={`difficulty-badge ${content.difficulty}`}>
                  {content.difficulty === 'beginner' ? 'Beginner' : content.difficulty === 'intermediate' ? 'Gemiddeld' : 'Gevorderd'}
                </span>
              )}
              {isCompleted && <span className="completed-badge"><FaCheck /> Voltooid</span>}
            </div>

            <h1 className="content-title">{content.title}</h1>

            <div className="content-meta">
              {content.duration && (
                <span className="meta-item">
                  <FaClock /> {formatDuration(content.duration)}
                </span>
              )}
              <span className="meta-item">
                <FaEye /> {content.view_count || 0} views
              </span>
              <span className="meta-item">
                {renderStars(content.rating_avg || 0, content.rating_count || 0)}
              </span>
            </div>

            {content.source && (
              <div className="content-source">
                Bron: <strong>{content.source}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-main">
        <div className="container">
          <div className="content-layout">
            {/* Left Column - Content Details */}
            <div className="content-details">
              {/* Thumbnail/Preview */}
              {content.thumbnail_url && (
                <div className="content-preview">
                  <img src={content.thumbnail_url} alt={content.title} />
                  {content.url && (
                    <div className="preview-overlay">
                      <button className="play-button" onClick={handleStartContent}>
                        <FaPlay /> Start Leren
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="content-description">
                <h2>Over deze content</h2>
                <p>{content.description}</p>
              </div>

              {/* Content Actions */}
              {content.url && (
                <div className="content-link">
                  <button onClick={handleOpenViewer} className="btn btn-primary btn-lg">
                    <FaPlay /> Open Content
                  </button>
                  <a href={content.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg">
                    <FaExternalLinkAlt /> Extern Openen
                  </a>
                </div>
              )}

              {/* Rating Section */}
              <div className="rating-section card">
                <h3>Beoordeel deze content</h3>
                <p className="rating-subtitle">Help andere studenten door je ervaring te delen</p>

                <div className="rating-input">
                  <label>Je beoordeling:</label>
                  {renderStars(0, 0, true)}
                </div>

                <div className="review-input">
                  <label>Review (optioneel):</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Deel je ervaring met deze content..."
                    rows="4"
                    className="form-input"
                  />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleRatingSubmit}
                  disabled={submittingRating || rating === 0}
                >
                  {submittingRating ? 'Verzenden...' : 'Beoordeling Verzenden'}
                </button>
              </div>
            </div>

            {/* Right Column - Progress & Actions */}
            <div className="content-sidebar">
              {/* Progress Card */}
              <div className="card progress-card">
                <h3>Je Voortgang</h3>

                {userProgress ? (
                  <>
                    <div className="progress-stats">
                      <div className="stat-item">
                        <span className="stat-label">Status</span>
                        <span className={`stat-value status-${userProgress.status}`}>
                          {userProgress.status === 'completed' ? 'Voltooid' :
                           userProgress.status === 'in_progress' ? 'Bezig' : 'Niet gestart'}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Voortgang</span>
                        <span className="stat-value">{userProgress.progress_percentage || 0}%</span>
                      </div>
                    </div>

                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{ width: `${userProgress.progress_percentage || 0}%` }}
                      />
                    </div>

                    {!isCompleted && (
                      <button
                        className="btn btn-success btn-block"
                        onClick={handleCompleteContent}
                      >
                        <FaCheck /> Markeer als Voltooid
                      </button>
                    )}

                    {isCompleted && (
                      <div className="completion-message">
                        <FaCheck className="check-icon" />
                        <p>Gefeliciteerd! Je hebt deze content voltooid.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-progress">
                    <p>Je bent nog niet begonnen met deze content.</p>
                    <button className="btn btn-primary btn-block" onClick={handleStartContent}>
                      <FaPlay /> Start Leren
                    </button>
                  </div>
                )}
              </div>

              {/* Rewards Card */}
              <div className="card rewards-card">
                <h3>Beloningen</h3>
                <div className="reward-item">
                  <span className="reward-icon">⭐</span>
                  <div className="reward-info">
                    <span className="reward-label">Punten bij voltooiing</span>
                    <span className="reward-value">{content.points_reward || 0} punten</span>
                  </div>
                </div>
              </div>

              {/* Module Info */}
              {content.module_title && (
                <div className="card module-card">
                  <h3>Module</h3>
                  <p className="module-name">{content.module_title}</p>
                </div>
              )}

              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <div className="card tags-card">
                  <h3>Tags</h3>
                  <div className="tags-list">
                    {(() => {
                      try {
                        const tags = typeof content.tags === 'string'
                          ? JSON.parse(content.tags)
                          : content.tags;
                        return Array.isArray(tags) ? tags.map((tag, index) => (
                          <span key={index} className="tag">
                            {tag}
                          </span>
                        )) : null;
                      } catch (error) {
                        console.error('Error parsing tags:', error);
                        return null;
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentView;
