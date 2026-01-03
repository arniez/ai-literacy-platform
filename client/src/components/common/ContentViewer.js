import React, { useState } from 'react';
import { FaTimes, FaExpand, FaCompress, FaExternalLinkAlt } from 'react-icons/fa';
import './ContentViewer.css';

const ContentViewer = ({ content, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const openExternal = () => {
    if (content.url) {
      window.open(content.url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderContent = () => {
    if (!content.url) {
      return (
        <div className="content-placeholder">
          <h3>Content Preview</h3>
          <p>{content.description}</p>
          <p className="content-note">
            Deze content heeft geen externe URL. Dit is een voorbeeld weergave.
          </p>
        </div>
      );
    }

    // Check if URL is a video (YouTube, Vimeo, etc.)
    if (isVideoUrl(content.url)) {
      return (
        <div className="content-embed">
          <iframe
            src={getEmbedUrl(content.url)}
            title={content.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Check if URL is Spotify
    if (content.url.includes('spotify.com')) {
      const spotifyEmbedUrl = content.url.replace('open.spotify.com', 'open.spotify.com/embed');
      return (
        <div className="content-embed">
          <iframe
            src={spotifyEmbedUrl}
            title={content.title}
            frameBorder="0"
            allow="encrypted-media"
          />
        </div>
      );
    }

    // For other content types, show iframe
    return (
      <div className="content-embed">
        <iframe
          src={content.url}
          title={content.title}
          frameBorder="0"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    );
  };

  const isVideoUrl = (url) => {
    return url.includes('youtube.com') ||
           url.includes('youtu.be') ||
           url.includes('vimeo.com');
  };

  const getEmbedUrl = (url) => {
    // YouTube
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Vimeo
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }

    return url;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`content-viewer-backdrop ${isExpanded ? 'expanded' : ''}`}
        onClick={onClose}
      />

      {/* Content Viewer */}
      <div className={`content-viewer ${isExpanded ? 'expanded' : ''}`}>
        {/* Header */}
        <div className="content-viewer-header">
          <div className="content-viewer-title">
            <h3>{content.title}</h3>
            <span className="content-type-label">{content.content_type}</span>
          </div>

          <div className="content-viewer-actions">
            {content.url && (
              <button
                className="viewer-action-btn"
                onClick={openExternal}
                title="Open in nieuw tabblad"
              >
                <FaExternalLinkAlt />
              </button>
            )}
            <button
              className="viewer-action-btn"
              onClick={toggleExpand}
              title={isExpanded ? 'Verkleinen' : 'Volledig scherm'}
            >
              {isExpanded ? <FaCompress /> : <FaExpand />}
            </button>
            <button
              className="viewer-action-btn close-btn"
              onClick={onClose}
              title="Sluiten"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="content-viewer-body">
          {renderContent()}
        </div>

        {/* Footer with description */}
        {!isExpanded && (
          <div className="content-viewer-footer">
            <p className="content-description">{content.description}</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ContentViewer;
