const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
require('dotenv').config({ path: './config/config.env' });

const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data (in reverse order of dependencies)
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE notifications');
    await pool.query('TRUNCATE TABLE user_follows');
    await pool.query('TRUNCATE TABLE user_activities');
    await pool.query('TRUNCATE TABLE user_submissions');
    await pool.query('TRUNCATE TABLE content_ratings');
    await pool.query('TRUNCATE TABLE comment_likes');
    await pool.query('TRUNCATE TABLE comments');
    await pool.query('TRUNCATE TABLE user_challenges');
    await pool.query('TRUNCATE TABLE challenges');
    await pool.query('TRUNCATE TABLE user_badges');
    await pool.query('TRUNCATE TABLE badges');
    await pool.query('TRUNCATE TABLE user_progress');
    await pool.query('TRUNCATE TABLE content');
    await pool.query('TRUNCATE TABLE modules');
    await pool.query('TRUNCATE TABLE users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Cleared existing data');

    // Seed Users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const [adminUser] = await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name, role, total_points, level, bio, study_program)
       VALUES
       ('admin', 'admin@ailiteracy.nl', ?, 'Admin', 'User', 'admin', 500, 6, 'AI Literacy Platform Administrator', 'Administration'),
       ('student1', 'student@student.nl', ?, 'Anna', 'de Vries', 'student', 250, 3, 'Informatica student geïnteresseerd in AI', 'Informatica'),
       ('student2', 'jan@student.nl', ?, 'Jan', 'Jansen', 'student', 180, 2, 'Bedrijfskunde student', 'Bedrijfskunde'),
       ('teacher1', 'teacher@teacher.nl', ?, 'Prof.', 'Peters', 'teacher', 450, 5, 'Docent AI en Machine Learning', 'Docent')`,
      [hashedPassword, hashedPassword, hashedPassword, hashedPassword]
    );

    console.log('Seeded users');

    // Seed Modules
    await pool.query(`
      INSERT INTO modules (title, description, icon, order_index, difficulty, estimated_duration, points_reward, is_published)
      VALUES
      ('AI Basiskennis', 'Leer de fundamentele concepten achter AI, machine learning en deep learning', '🎓', 1, 'beginner', 120, 100, true),
      ('AI Toepassingen', 'Ontdek hoe AI wordt toegepast in verschillende sectoren en beroepen', '🚀', 2, 'intermediate', 90, 150, true),
      ('Kritisch Denken', 'Leer AI-systemen kritisch te beoordelen en ethische vragen te stellen', '🧠', 3, 'intermediate', 60, 120, true),
      ('Praktische Vaardigheden', 'Ontwikkel praktische vaardigheden met AI-tools en -toepassingen', '🛠️', 4, 'advanced', 180, 200, true)
    `);

    console.log('Seeded modules');

    // Seed Content
    await pool.query(`
      INSERT INTO content (module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, rating_avg, rating_count)
      VALUES
      -- AI Basiskennis Module (Module 1)
      (1, 'AI Basiskennis Cursus', 'Leer de fundamentele concepten achter AI, machine learning en deep learning.', 'cursus', 'https://www.elementsofai.com', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500', 120, 'beginner', 50, '["ai-cursus", "basics"]', 'ai-cursus', true, 4.2, 312),
      (1, 'Elements of AI', 'Een gratis online cursus om AI begrijpelijker te maken voor een breder publiek.', 'cursus', 'https://www.elementsofai.com', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500', 180, 'beginner', 60, '["elementofai", "gratis"]', 'elementofai', true, 4.5, 402),
      (1, 'AI in het Onderwijs Podcast', 'Een podcast over hoe AI het onderwijs transformeert en welke kansen er liggen.', 'podcast', 'https://open.spotify.com/show/ai-onderwijs', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500', 45, 'beginner', 25, '["spotify", "onderwijs"]', 'spotify', false, 3.8, 189),

      -- AI Toepassingen Module (Module 2)
      (2, 'Predictive Maintenance bij NS: AI voor Onderhoud Treinstellen', 'Praktijkvoorbeeld: Hoe de Nederlandse Spoorwegen storingsdata en sensorgegevens gebruikt met AI om onderhoud te voorspellen en defecten voor te zijn.', 'praktijkvoorbeeld', '/cases/ns-predictive-maintenance', 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=500', 35, 'intermediate', 40, '["internal", "transport"]', 'internal', true, 4.3, 142),
      (2, 'AI in de Gezondheidszorg: Vroegdiagnostiek', 'Praktijkvoorbeeld: Hoe RadboudUMC AI gebruikt voor vroege detectie van longkanker via CT-scans.', 'praktijkvoorbeeld', '/cases/radboud-vroegdiagnostiek', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500', 45, 'intermediate', 45, '["internal", "healthcare"]', 'internal', false, 4.4, 187),
      (2, 'Introductie tot Machine Learning', 'Video uitleg over de basis van machine learning en hoe het werkt.', 'video', 'https://youtube.com/watch?v=ml-intro', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=500', 25, 'beginner', 30, '["youtube", "ml"]', 'youtube', false, 4.1, 298),

      -- Kritisch Denken Module (Module 3)
      (3, 'Praktijkworkshop: AI in Financiële Fraudedetectie', 'Interactieve workshop over hoe Rabobank machine learning inzet voor het detecteren van ongebruikelijke transacties en fraude.', 'praktijkvoorbeeld', '/cases/rabobank-fraud-detection', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500', 120, 'advanced', 80, '["internal", "finance", "workshop"]', 'internal', true, 4.7, 89),
      (3, 'Ethics in AI Game', 'Een interactief spel waarin je ethische dilemmas rond AI moet oplossen.', 'game', '/games/ethics-ai', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500', 30, 'intermediate', 35, '["game", "ethics"]', 'internal', false, 4.0, 256),

      -- Praktische Vaardigheden Module (Module 4)
      (4, 'ChatGPT voor Professionals', 'Leer hoe je ChatGPT effectief kunt inzetten in je dagelijkse werk.', 'cursus', 'https://learn.deeplearning.ai/chatgpt-prompt-eng', 'https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=500', 60, 'intermediate', 50, '["chatgpt", "prompting"]', 'deeplearning.ai', true, 4.6, 523),
      (4, 'AI Muziekgenerator Experiment', 'Experimenteer met AI om je eigen muziek te creëren.', 'game', '/experiments/music-generator', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500', 30, 'beginner', 30, '["music", "creative"]', 'internal', false, 4.2, 145)
    `);

    console.log('Seeded content');

    // Seed Badges
    await pool.query(`
      INSERT INTO badges (name, description, icon, badge_type, requirement_type, requirement_value, points_reward, rarity)
      VALUES
      ('AI Pioneer', 'Welkom bij AI Literacy! Begin je leerreis.', '🌟', 'special', 'points', 0, 10, 'common'),
      ('Knowledge Seeker', 'Lees 5 artikelen over AI', '📚', 'achievement', 'content_complete', 5, 25, 'common'),
      ('Ethical Thinker', 'Voltooi alle content in de Kritisch Denken module', '🧠', 'completion', 'content_complete', 10, 50, 'uncommon'),
      ('AI Expert', 'Bereik 500 punten', '🎓', 'achievement', 'points', 500, 100, 'rare'),
      ('Social Butterfly', 'Plaats 25 comments', '🦋', 'social', 'content_complete', 25, 30, 'uncommon'),
      ('Streak Master', 'Log 7 dagen achter elkaar in', '🔥', 'streak', 'streak_days', 7, 50, 'rare'),
      ('Master of AI', 'Voltooi alle modules', '👑', 'completion', 'content_complete', 30, 200, 'legendary'),
      ('Early Adopter', 'Een van de eerste 100 gebruikers', '🚀', 'special', 'points', 10, 25, 'epic'),
      ('Experimenter', 'Voltooi 3 experimenten', '🧪', 'achievement', 'content_complete', 3, 40, 'uncommon'),
      ('Video Enthusiast', 'Bekijk 10 videos', '📹', 'achievement', 'content_complete', 10, 35, 'common')
    `);

    console.log('Seeded badges');

    // Award some badges to demo users
    await pool.query(`
      INSERT INTO user_badges (user_id, badge_id, earned_at)
      VALUES
      (1, 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
      (1, 2, DATE_SUB(NOW(), INTERVAL 8 DAY)),
      (1, 4, DATE_SUB(NOW(), INTERVAL 5 DAY)),
      (2, 1, DATE_SUB(NOW(), INTERVAL 15 DAY)),
      (2, 2, DATE_SUB(NOW(), INTERVAL 12 DAY)),
      (3, 1, DATE_SUB(NOW(), INTERVAL 20 DAY))
    `);

    console.log('Seeded user badges');

    // Seed Challenges
    await pool.query(`
      INSERT INTO challenges (title, description, challenge_type, objective, target_value, points_reward, start_date, end_date)
      VALUES
      ('Dagelijkse Leerder', 'Voltooi vandaag 1 stuk content', 'daily', 'content_complete', 1, 15, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY)),
      ('Week van AI', 'Voltooi deze week 5 stukken content', 'weekly', 'content_complete', 5, 75, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY)),
      ('Maand van Groei', 'Verdien deze maand 200 punten', 'monthly', 'points', 200, 150, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY)),
      ('Social Learner', 'Plaats 3 comments deze week', 'weekly', 'comment_posted', 3, 30, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))
    `);

    console.log('Seeded challenges');

    // Seed some user progress
    await pool.query(`
      INSERT INTO user_progress (user_id, content_id, status, progress_percentage, time_spent, last_accessed, completed_at)
      VALUES
      (2, 1, 'completed', 100, 7200, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
      (2, 2, 'completed', 100, 10800, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
      (2, 3, 'in_progress', 60, 1620, NOW(), NULL),
      (3, 1, 'completed', 100, 8100, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
      (3, 4, 'in_progress', 45, 945, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL)
    `);

    console.log('Seeded user progress');

    // Seed some comments
    await pool.query(`
      INSERT INTO comments (user_id, content_id, comment_text, likes_count, created_at)
      VALUES
      (2, 1, 'Geweldige cursus! Heel duidelijk uitgelegd.', 5, DATE_SUB(NOW(), INTERVAL 4 DAY)),
      (3, 1, 'Ik vond het soms wat complex, maar uiteindelijk heel leerzaam.', 3, DATE_SUB(NOW(), INTERVAL 3 DAY)),
      (2, 2, 'Elements of AI is echt een aanrader voor beginners!', 8, DATE_SUB(NOW(), INTERVAL 2 DAY)),
      (4, 4, 'Interessant praktijkvoorbeeld, heel relevant voor mijn werk.', 6, DATE_SUB(NOW(), INTERVAL 1 DAY))
    `);

    console.log('Seeded comments');

    // Seed some ratings
    await pool.query(`
      INSERT INTO content_ratings (user_id, content_id, rating, review_text, created_at)
      VALUES
      (2, 1, 5, 'Perfecte introductie tot AI!', DATE_SUB(NOW(), INTERVAL 5 DAY)),
      (3, 1, 4, 'Goed, maar soms wat langdradig.', DATE_SUB(NOW(), INTERVAL 10 DAY)),
      (2, 2, 5, 'Beste online AI cursus die ik heb gevolgd.', DATE_SUB(NOW(), INTERVAL 3 DAY))
    `);

    console.log('Seeded ratings');

    // Seed some activities
    await pool.query(`
      INSERT INTO user_activities (user_id, activity_type, activity_data, points_earned, created_at)
      VALUES
      (2, 'content_completed', '{"contentId": 1}', 50, DATE_SUB(NOW(), INTERVAL 5 DAY)),
      (2, 'badge_earned', '{"badgeId": 1, "badgeName": "AI Pioneer"}', 10, DATE_SUB(NOW(), INTERVAL 15 DAY)),
      (2, 'content_completed', '{"contentId": 2}', 60, DATE_SUB(NOW(), INTERVAL 3 DAY)),
      (3, 'badge_earned', '{"badgeId": 1, "badgeName": "AI Pioneer"}', 10, DATE_SUB(NOW(), INTERVAL 20 DAY))
    `);

    console.log('Seeded activities');

    // Seed some notifications
    await pool.query(`
      INSERT INTO notifications (user_id, notification_type, title, message, link_url, is_read, created_at)
      VALUES
      (2, 'badge', 'New Badge Earned!', 'You earned the "Knowledge Seeker" badge!', '/badges', false, DATE_SUB(NOW(), INTERVAL 1 DAY)),
      (2, 'achievement', 'Content Completed!', 'You earned 60 points!', '/dashboard', true, DATE_SUB(NOW(), INTERVAL 3 DAY)),
      (3, 'system', 'Welcome to AI Literacy!', 'Start your journey by exploring learning materials', '/leermaterialen', true, DATE_SUB(NOW(), INTERVAL 20 DAY))
    `);

    console.log('Seeded notifications');

    console.log('✅ Database seeding completed successfully!');
    console.log('\nDemo Users:');
    console.log('- Admin: admin@ailiteracy.nl / password123');
    console.log('- Student: student@student.nl / password123');
    console.log('- Jan: jan@student.nl / password123');
    console.log('- Teacher: teacher@teacher.nl / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
