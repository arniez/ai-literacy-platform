import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaFilter, FaStar, FaEye, FaBook, FaVideo, FaHeadphones, FaGamepad, FaBriefcase, FaCheck } from 'react-icons/fa';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Leermaterialen.css';

const Leermaterialen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALLES');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: '',
    module: ''
  });

  const tabs = [
    { id: 'ALLES', label: 'ALLES', type: null },
    { id: 'BASIS', label: 'BASIS', tag: 'basis' },
    { id: 'E-LEARNING', label: 'E-LEARNING', type: 'cursus' },
    { id: 'PODCASTS', label: 'PODCASTS', type: 'podcast' },
    { id: 'VIDEOS', label: "VIDEO'S", type: 'video' },
    { id: 'GAMES', label: 'GAMES', type: 'game' },
    { id: 'PRAKTIJKVOORBEELDEN', label: 'PRAKTIJKVOORBEELDEN', type: 'praktijkvoorbeeld' }
  ];

  // Handle tab query parameter on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && tabs.find(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters, searchTerm]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const currentTab = tabs.find(t => t.id === activeTab);

      const params = new URLSearchParams();

      // For BASIS tab, filter by 'basis' tag
      if (currentTab?.tag) {
        params.append('tag', currentTab.tag);
      } else if (currentTab?.type) {
        params.append('type', currentTab.type);
      }

      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.module && !currentTab?.tag) params.append('moduleId', filters.module);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/content?${params.toString()}`);
      setContent(response.data.data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Fout bij het laden van leermaterialen');
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

  const getContentTypeLabel = (type) => {
    const labels = {
      cursus: 'Cursus',
      video: 'Video',
      podcast: 'Podcast',
      game: 'Game',
      praktijkvoorbeeld: 'Praktijkvoorbeeld',
      artikel: 'Artikel'
    };
    return labels[type] || type;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} uur ${mins} min` : `${hours} uur`;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="star filled" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStar key={i} className="star half-filled" />);
      } else {
        stars.push(<FaStar key={i} className="star" />);
      }
    }
    return stars;
  };

  const handleContentClick = (contentId) => {
    navigate(`/content/${contentId}`);
  };

  return (
    <div className="leermaterialen-page">
      {/* Header with Tabs */}
      <div className="page-header-section">
        <div className="container">
          <div className="header-top">
            <h1 className="page-title">Leermaterialen</h1>

            <div className="header-actions">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Zoeken..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <button
                className={`filter-toggle ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="content-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>Moeilijkheidsgraad:</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                  className="filter-select"
                >
                  <option value="">Alle niveaus</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Gemiddeld</option>
                  <option value="advanced">Gevorderd</option>
                </select>
              </div>

              <button
                className="btn btn-sm btn-outline"
                onClick={() => setFilters({ difficulty: '', module: '' })}
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-section">
        <div className="container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Leermaterialen laden...</p>
            </div>
          ) : content.length === 0 ? (
            <div className="empty-state">
              <FaSearch size={48} />
              <h3>Geen resultaten gevonden</h3>
              <p>Probeer andere zoektermen of filters</p>
            </div>
          ) : (
            <div className="content-grid">
              {content.map((item) => (
                <div
                  key={item.id}
                  className="content-card"
                  onClick={() => handleContentClick(item.id)}
                >
                  {/* Thumbnail */}
                  <div className="card-thumbnail">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt={item.title} />
                    ) : (
                      <div className="thumbnail-placeholder">
                        {getContentIcon(item.content_type)}
                      </div>
                    )}
                    {item.is_featured && (
                      <div className="featured-badge">Featured</div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div className="card-content">
                    {/* Meta Info */}
                    <div className="card-meta">
                      <span className="content-type-badge">
                        {getContentIcon(item.content_type)}
                        {getContentTypeLabel(item.content_type)}
                      </span>
                      {item.duration && (
                        <span className="duration-badge">
                          {formatDuration(item.duration)}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="card-title">{item.title}</h3>

                    {/* Description */}
                    <p className="card-description">
                      {item.description && item.description.length > 120
                        ? `${item.description.substring(0, 120)}...`
                        : item.description}
                    </p>

                    {/* Rating & Views */}
                    <div className="card-stats">
                      <div className="rating">
                        {renderStars(item.rating_avg || 0)}
                        <span className="rating-count">({item.rating_count || 0})</span>
                      </div>
                      <div className="views">
                        <FaEye /> {item.view_count || 0} views
                      </div>
                    </div>

                    {/* Meta Badges */}
                    <div className="meta-badges">
                      {item.source && (
                        <div className="source-badge">
                          Bron: <span>{item.source}</span>
                        </div>
                      )}
                      {item.tags && (() => {
                        try {
                          const tags = typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags;
                          return Array.isArray(tags) && tags.includes('basis');
                        } catch (e) {
                          return false;
                        }
                      })() && (
                        <div className="basis-badge">
                          Basis
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button className="btn btn-primary card-action">
                      Bekijken
                      <FaCheck className="check-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leermaterialen;
