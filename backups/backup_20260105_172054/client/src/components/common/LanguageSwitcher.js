import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${language === 'nl' ? 'active' : ''}`}
        onClick={() => changeLanguage('nl')}
        title="Nederlands"
      >
        🇳🇱 NL
      </button>
      <button
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        title="English"
      >
        🇬🇧 EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
