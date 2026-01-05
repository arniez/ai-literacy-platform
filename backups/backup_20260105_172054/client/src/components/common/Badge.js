import React from 'react';
import { FaMedal, FaTrophy, FaStar, FaCrown, FaFire, FaGem } from 'react-icons/fa';
import './Badge.css';

const Badge = ({ badge, size = 'medium', showProgress = false, locked = false }) => {
  const getBadgeIcon = (category) => {
    const icons = {
      achievement: <FaTrophy />,
      completion: <FaMedal />,
      special: <FaCrown />,
      streak: <FaFire />,
      mastery: <FaStar />,
      rare: <FaGem />
    };
    return icons[category] || <FaMedal />;
  };

  const getRarityClass = (rarity) => {
    return `badge-${rarity?.toLowerCase() || 'common'}`;
  };

  const getRarityGlow = (rarity) => {
    const glows = {
      common: 'rgba(158, 158, 158, 0.3)',
      uncommon: 'rgba(76, 175, 80, 0.4)',
      rare: 'rgba(33, 150, 243, 0.4)',
      epic: 'rgba(156, 39, 176, 0.5)',
      legendary: 'rgba(255, 193, 7, 0.6)'
    };
    return glows[rarity?.toLowerCase()] || glows.common;
  };

  return (
    <div
      className={`badge-component ${getRarityClass(badge.rarity)} badge-${size} ${locked ? 'badge-locked' : ''}`}
      style={{
        '--badge-glow': getRarityGlow(badge.rarity)
      }}
    >
      <div className="badge-inner">
        {/* Badge Icon/Image */}
        <div className="badge-icon-container">
          {badge.icon_url ? (
            <img src={badge.icon_url} alt={badge.name} className="badge-icon-img" />
          ) : (
            <div className="badge-icon-default">
              {getBadgeIcon(badge.category)}
            </div>
          )}

          {locked && (
            <div className="badge-lock-overlay">
              <span className="lock-icon">🔒</span>
            </div>
          )}
        </div>

        {/* Badge Info */}
        <div className="badge-info">
          <h4 className="badge-name">{badge.name}</h4>
          <p className="badge-description">{badge.description}</p>

          {/* Rarity Label */}
          <div className="badge-rarity-label">
            {badge.rarity === 'legendary' && '👑 '}
            {badge.rarity === 'epic' && '💜 '}
            {badge.rarity === 'rare' && '💎 '}
            {badge.rarity === 'uncommon' && '🟢 '}
            {badge.rarity === 'common' && '⚪ '}
            <span className="rarity-text">
              {badge.rarity === 'legendary' ? 'Legendarisch' :
               badge.rarity === 'epic' ? 'Epic' :
               badge.rarity === 'rare' ? 'Zeldzaam' :
               badge.rarity === 'uncommon' ? 'Ongewoon' : 'Gewoon'}
            </span>
          </div>

          {/* Points */}
          {badge.points_reward > 0 && (
            <div className="badge-points">
              +{badge.points_reward} punten
            </div>
          )}

          {/* Progress Bar (for locked badges) */}
          {locked && showProgress && badge.progress !== undefined && (
            <div className="badge-progress">
              <div className="badge-progress-bar">
                <div
                  className="badge-progress-fill"
                  style={{ width: `${badge.progress}%` }}
                />
              </div>
              <span className="badge-progress-text">
                {badge.progress}% voltooid
              </span>
            </div>
          )}

          {/* Earned Date */}
          {badge.earned_at && (
            <div className="badge-earned-date">
              Verdiend op {new Date(badge.earned_at).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          )}
        </div>
      </div>

      {/* Shine Effect */}
      {!locked && <div className="badge-shine"></div>}
    </div>
  );
};

export default Badge;
