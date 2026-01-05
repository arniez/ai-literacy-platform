import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaRocket, FaTrophy, FaUsers, FaChartLine } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <FaRocket />,
      title: 'Interactief Leren',
      description: 'Leer AI concepten door praktische oefeningen en experimenten'
    },
    {
      icon: <FaTrophy />,
      title: 'Gamification',
      description: 'Verdien badges, punten en stijg in levels terwijl je leert'
    },
    {
      icon: <FaUsers />,
      title: 'Social Learning',
      description: 'Leer samen met medestudenten en deel je voortgang'
    },
    {
      icon: <FaChartLine />,
      title: 'Voortgangsregistratie',
      description: 'Houd je leerproces bij en zie je groei over tijd'
    }
  ];

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welkom bij AI Literacy
              <span className="gradient-text"> Training Platform</span>
            </h1>
            <p className="hero-subtitle">
              Ontwikkel essentiële AI-vaardigheden voor de toekomst.
              Leer in je eigen tempo met interactieve content, gamification en sociale features.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Naar Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Start Gratis
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-lg">
                    Inloggen
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Waarom AI Literacy?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Klaar om te beginnen?</h2>
          <p>Sluit je aan bij honderden studenten die hun AI-kennis vergroten</p>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-primary btn-lg">
              Registreer Nu
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
