import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to Dutch
    return localStorage.getItem('language') || 'nl';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('language', language);
    // Update HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (lang) => {
    if (lang === 'nl' || lang === 'en') {
      setLanguage(lang);
    }
  };

  const value = {
    language,
    changeLanguage,
    t: (key) => translations[language][key] || key
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Translations object
const translations = {
  nl: {
    // Navigation
    'nav.home': 'Home',
    'nav.leermaterialen': 'Leermaterialen',
    'nav.dashboard': 'Dashboard',
    'nav.challenges': 'Uitdagingen',
    'nav.leaderboard': 'Klassement',
    'nav.profile': 'Profiel',
    'nav.logout': 'Uitloggen',
    'nav.login': 'Inloggen',
    'nav.register': 'Registreren',
    'nav.points': 'punten',
    'nav.level': 'Level',

    // Home page
    'home.hero.title': 'Ontwikkel je AI-geletterdheid',
    'home.hero.subtitle': 'Leer AI met 37+ hoogwaardige leermaterialen, praktijkvoorbeelden van Nederlandse bedrijven en een motiverend puntensysteem',
    'home.hero.cta': 'Start met Leren',
    'home.hero.secondary': 'Meer Informatie',

    // Content types
    'content.cursus': 'Cursus',
    'content.video': 'Video',
    'content.podcast': 'Podcast',
    'content.game': 'Game',
    'content.praktijkvoorbeeld': 'Praktijkvoorbeeld',
    'content.artikel': 'Artikel',
    'content.all': 'Alles',

    // Difficulty levels
    'difficulty.beginner': 'Beginner',
    'difficulty.intermediate': 'Gemiddeld',
    'difficulty.advanced': 'Gevorderd',

    // Leermaterialen page
    'leermaterialen.title': 'Leermaterialen',
    'leermaterialen.subtitle': 'Ontdek en leer van 37+ kwalitatieve bronnen',
    'leermaterialen.search': 'Zoeken...',
    'leermaterialen.filter': 'Filters',
    'leermaterialen.difficulty': 'Moeilijkheidsgraad',
    'leermaterialen.all_difficulties': 'Alle niveaus',
    'leermaterialen.view_content': 'Bekijk Content',
    'leermaterialen.no_results': 'Geen resultaten gevonden',
    'leermaterialen.try_search': 'Probeer een andere zoekopdracht of filter',
    'leermaterialen.loading': 'Content laden...',
    'leermaterialen.featured': 'Uitgelicht',
    'leermaterialen.views': 'views',
    'leermaterialen.source': 'Bron',

    // Content detail page
    'content.back': 'Terug naar Leermaterialen',
    'content.start_learning': 'Start Leren',
    'content.open_content': 'Open Content',
    'content.about': 'Over deze content',
    'content.rate_title': 'Beoordeel deze content',
    'content.rate_subtitle': 'Help andere studenten door je ervaring te delen',
    'content.your_rating': 'Je beoordeling:',
    'content.review_optional': 'Review (optioneel):',
    'content.review_placeholder': 'Deel je ervaring met deze content...',
    'content.submit_rating': 'Beoordeling Verzenden',
    'content.submitting': 'Verzenden...',
    'content.your_progress': 'Je Voortgang',
    'content.status': 'Status',
    'content.progress': 'Voortgang',
    'content.mark_complete': 'Markeer als Voltooid',
    'content.completed': 'Voltooid',
    'content.in_progress': 'Bezig',
    'content.not_started': 'Niet gestart',
    'content.congratulations': 'Gefeliciteerd! Je hebt deze content voltooid.',
    'content.no_progress': 'Je bent nog niet begonnen met deze content.',
    'content.rewards': 'Beloningen',
    'content.points_on_completion': 'Punten bij voltooiing',
    'content.module': 'Module',
    'content.tags': 'Tags',

    // Profile page
    'profile.loading': 'Profiel laden...',
    'profile.not_found': 'Profiel niet gevonden',
    'profile.member_since': 'Lid sinds',
    'profile.admin': 'Admin',
    'profile.teacher': 'Docent',
    'profile.student': 'Student',
    'profile.level': 'Level',
    'profile.total_points': 'Totale Punten',
    'profile.all_time': 'Alle tijd',
    'profile.badges': 'Badges',
    'profile.earned': 'Verdiend',
    'profile.streak': 'Streak',
    'profile.days': 'dagen',
    'profile.tab.progress': 'Voortgang',
    'profile.tab.badges': 'Badges',
    'profile.tab.favorites': 'Favorieten',
    'profile.tab.content': 'Mijn Content',
    'profile.progress.title': 'Leervoortgang',
    'profile.progress.subtitle': 'Bekijk alle voltooide en lopende leermaterialen',
    'profile.progress.total_started': 'Totaal Gestart',
    'profile.progress.completed': 'Voltooid',
    'profile.progress.in_progress': 'In Behandeling',
    'profile.progress.completion_rate': 'Voltooiingspercentage',
    'profile.progress.no_progress': 'Nog geen voortgang',
    'profile.progress.start_learning': 'Start met leren',
    'profile.progress.completed_on': 'Voltooid op',
    'profile.badges.title': 'Mijn Badges',
    'profile.badges.subtitle': 'Verzamel badges door content te voltooien en uitdagingen aan te gaan',
    'profile.badges.no_badges': 'Nog geen badges',
    'profile.badges.earn_first': 'Voltooii content en challenges om je eerste badge te verdienen!',
    'profile.favorites.title': 'Mijn Favorieten',
    'profile.favorites.subtitle': 'Content die je hebt opgeslagen voor later',
    'profile.favorites.no_favorites': 'Nog geen favorieten',
    'profile.favorites.add_content': 'Voeg content toe aan je favorieten om ze later terug te vinden',
    'profile.favorites.view': 'Bekijken',
    'profile.favorites.discover': 'Ontdek content',
    'profile.content.title': 'Mijn Toegevoegde Content',
    'profile.content.subtitle': 'Content die je hebt aangemaakt of geüpload',
    'profile.content.add_new': 'Nieuwe Content Toevoegen',
    'profile.content.no_content': 'Nog geen eigen content',
    'profile.content.share': 'Deel je eigen leermaterialen met de community',

    // Badge rarities
    'badge.common': 'Gewoon',
    'badge.uncommon': 'Ongewoon',
    'badge.rare': 'Zeldzaam',
    'badge.epic': 'Epic',
    'badge.legendary': 'Legendarisch',
    'badge.locked': 'Vergrendeld',
    'badge.progress': 'voltooid',

    // Auth
    'auth.login': 'Inloggen',
    'auth.register': 'Registreren',
    'auth.email': 'E-mailadres',
    'auth.password': 'Wachtwoord',
    'auth.name': 'Naam',
    'auth.confirm_password': 'Bevestig Wachtwoord',
    'auth.forgot_password': 'Wachtwoord vergeten?',
    'auth.no_account': 'Nog geen account?',
    'auth.have_account': 'Al een account?',
    'auth.sign_up': 'Aanmelden',
    'auth.sign_in': 'Inloggen',

    // Common
    'common.loading': 'Laden...',
    'common.error': 'Fout',
    'common.success': 'Gelukt',
    'common.cancel': 'Annuleren',
    'common.save': 'Opslaan',
    'common.delete': 'Verwijderen',
    'common.edit': 'Bewerken',
    'common.close': 'Sluiten',
    'common.search': 'Zoeken',
    'common.filter': 'Filter',
    'common.sort': 'Sorteren',
    'common.view_all': 'Bekijk alles',
    'common.minutes': 'minuten',
    'common.hours': 'uur',
    'common.points': 'punten',

    // Toast messages
    'toast.login_success': 'Succesvol ingelogd!',
    'toast.logout_success': 'Succesvol uitgelogd',
    'toast.register_success': 'Registratie gelukt! Je kunt nu inloggen.',
    'toast.content_started': 'Content gestart! Veel leerplezier.',
    'toast.content_completed': 'Content voltooid! Je hebt {points} punten verdiend! 🎉',
    'toast.rating_submitted': 'Bedankt voor je beoordeling!',
    'toast.error_generic': 'Er is iets misgegaan. Probeer het opnieuw.',
    'toast.error_login': 'Fout bij het inloggen',
    'toast.error_profile': 'Fout bij het laden van profiel',
    'toast.select_rating': 'Selecteer een rating',
  },

  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.leermaterialen': 'Learning Materials',
    'nav.dashboard': 'Dashboard',
    'nav.challenges': 'Challenges',
    'nav.leaderboard': 'Leaderboard',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.points': 'points',
    'nav.level': 'Level',

    // Home page
    'home.hero.title': 'Develop Your AI Literacy',
    'home.hero.subtitle': 'Learn AI with 37+ high-quality learning materials, real-world examples from Dutch companies, and a motivating points system',
    'home.hero.cta': 'Start Learning',
    'home.hero.secondary': 'Learn More',

    // Content types
    'content.cursus': 'Course',
    'content.video': 'Video',
    'content.podcast': 'Podcast',
    'content.game': 'Game',
    'content.praktijkvoorbeeld': 'Case Study',
    'content.artikel': 'Article',
    'content.all': 'All',

    // Difficulty levels
    'difficulty.beginner': 'Beginner',
    'difficulty.intermediate': 'Intermediate',
    'difficulty.advanced': 'Advanced',

    // Leermaterialen page
    'leermaterialen.title': 'Learning Materials',
    'leermaterialen.subtitle': 'Discover and learn from 37+ quality resources',
    'leermaterialen.search': 'Search...',
    'leermaterialen.filter': 'Filters',
    'leermaterialen.difficulty': 'Difficulty Level',
    'leermaterialen.all_difficulties': 'All Levels',
    'leermaterialen.view_content': 'View Content',
    'leermaterialen.no_results': 'No results found',
    'leermaterialen.try_search': 'Try a different search or filter',
    'leermaterialen.loading': 'Loading content...',
    'leermaterialen.featured': 'Featured',
    'leermaterialen.views': 'views',
    'leermaterialen.source': 'Source',

    // Content detail page
    'content.back': 'Back to Learning Materials',
    'content.start_learning': 'Start Learning',
    'content.open_content': 'Open Content',
    'content.about': 'About this content',
    'content.rate_title': 'Rate this content',
    'content.rate_subtitle': 'Help other students by sharing your experience',
    'content.your_rating': 'Your rating:',
    'content.review_optional': 'Review (optional):',
    'content.review_placeholder': 'Share your experience with this content...',
    'content.submit_rating': 'Submit Rating',
    'content.submitting': 'Submitting...',
    'content.your_progress': 'Your Progress',
    'content.status': 'Status',
    'content.progress': 'Progress',
    'content.mark_complete': 'Mark as Complete',
    'content.completed': 'Completed',
    'content.in_progress': 'In Progress',
    'content.not_started': 'Not Started',
    'content.congratulations': 'Congratulations! You have completed this content.',
    'content.no_progress': 'You haven\'t started this content yet.',
    'content.rewards': 'Rewards',
    'content.points_on_completion': 'Points on completion',
    'content.module': 'Module',
    'content.tags': 'Tags',

    // Profile page
    'profile.loading': 'Loading profile...',
    'profile.not_found': 'Profile not found',
    'profile.member_since': 'Member since',
    'profile.admin': 'Admin',
    'profile.teacher': 'Teacher',
    'profile.student': 'Student',
    'profile.level': 'Level',
    'profile.total_points': 'Total Points',
    'profile.all_time': 'All time',
    'profile.badges': 'Badges',
    'profile.earned': 'Earned',
    'profile.streak': 'Streak',
    'profile.days': 'days',
    'profile.tab.progress': 'Progress',
    'profile.tab.badges': 'Badges',
    'profile.tab.favorites': 'Favorites',
    'profile.tab.content': 'My Content',
    'profile.progress.title': 'Learning Progress',
    'profile.progress.subtitle': 'View all completed and ongoing learning materials',
    'profile.progress.total_started': 'Total Started',
    'profile.progress.completed': 'Completed',
    'profile.progress.in_progress': 'In Progress',
    'profile.progress.completion_rate': 'Completion Rate',
    'profile.progress.no_progress': 'No progress yet',
    'profile.progress.start_learning': 'Start learning',
    'profile.progress.completed_on': 'Completed on',
    'profile.badges.title': 'My Badges',
    'profile.badges.subtitle': 'Collect badges by completing content and taking on challenges',
    'profile.badges.no_badges': 'No badges yet',
    'profile.badges.earn_first': 'Complete content and challenges to earn your first badge!',
    'profile.favorites.title': 'My Favorites',
    'profile.favorites.subtitle': 'Content you\'ve saved for later',
    'profile.favorites.no_favorites': 'No favorites yet',
    'profile.favorites.add_content': 'Add content to your favorites to find them later',
    'profile.favorites.view': 'View',
    'profile.favorites.discover': 'Discover content',
    'profile.content.title': 'My Added Content',
    'profile.content.subtitle': 'Content you have created or uploaded',
    'profile.content.add_new': 'Add New Content',
    'profile.content.no_content': 'No own content yet',
    'profile.content.share': 'Share your own learning materials with the community',

    // Badge rarities
    'badge.common': 'Common',
    'badge.uncommon': 'Uncommon',
    'badge.rare': 'Rare',
    'badge.epic': 'Epic',
    'badge.legendary': 'Legendary',
    'badge.locked': 'Locked',
    'badge.progress': 'complete',

    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.name': 'Name',
    'auth.confirm_password': 'Confirm Password',
    'auth.forgot_password': 'Forgot password?',
    'auth.no_account': 'Don\'t have an account?',
    'auth.have_account': 'Already have an account?',
    'auth.sign_up': 'Sign Up',
    'auth.sign_in': 'Sign In',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.view_all': 'View all',
    'common.minutes': 'minutes',
    'common.hours': 'hours',
    'common.points': 'points',

    // Toast messages
    'toast.login_success': 'Successfully logged in!',
    'toast.logout_success': 'Successfully logged out',
    'toast.register_success': 'Registration successful! You can now log in.',
    'toast.content_started': 'Content started! Happy learning.',
    'toast.content_completed': 'Content completed! You earned {points} points! 🎉',
    'toast.rating_submitted': 'Thank you for your rating!',
    'toast.error_generic': 'Something went wrong. Please try again.',
    'toast.error_login': 'Error logging in',
    'toast.error_profile': 'Error loading profile',
    'toast.select_rating': 'Please select a rating',
  }
};

export default LanguageContext;
