-- ============================================================
-- AI Literacy Platform - SEED DATA (Deel 2)
-- Plak dit NA het schema script
-- ============================================================

-- Users (14 rows)
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES
(1, 'admin', 'admin@ailiteracy.nl', '$2a$10$qSQKXNuF4C.WaUdETAkRY.Bui.bj.IxM1TCSYDXn.wSmymZ1w2.Hu', 'Admin', 'User', 'admin', 'Administration', NULL, 'AI Literacy Platform Administrator', 505, 6, '2026-01-02 09:33:27', '2026-01-02 10:15:31', true),
(2, 'student1', 'student@student.nl', '$2a$10$qSQKXNuF4C.WaUdETAkRY.Bui.bj.IxM1TCSYDXn.wSmymZ1w2.Hu', 'Anna', 'de Vries', 'student', 'Informatica', NULL, 'Informatica student geïnteresseerd in AI', 445, 5, '2026-01-02 09:33:27', '2026-01-03 18:39:20.966', true),
(3, 'student2', 'jan@student.nl', '$2a$10$qSQKXNuF4C.WaUdETAkRY.Bui.bj.IxM1TCSYDXn.wSmymZ1w2.Hu', 'Jan', 'Jansen', 'student', 'Bedrijfskunde', NULL, 'Bedrijfskunde student', 180, 2, '2026-01-02 09:33:27', NULL, true),
(4, 'teacher1', 'teacher@teacher.nl', '$2a$10$qSQKXNuF4C.WaUdETAkRY.Bui.bj.IxM1TCSYDXn.wSmymZ1w2.Hu', 'Prof.', 'Peters', 'teacher', 'Docent', NULL, 'Docent AI en Machine Learning', 450, 5, '2026-01-02 09:33:27', NULL, true),
(5, 'sophie_m', 'sophie@example.com', '$2b$10$YourHashHere', 'Sophie', 'Martens', 'student', 'Data Science', NULL, NULL, 820, 9, '2026-01-02 15:16:35', NULL, true),
(6, 'lucas_b', 'lucas@example.com', '$2b$10$YourHashHere', 'Lucas', 'Bakker', 'student', 'Computer Science', NULL, NULL, 750, 8, '2026-01-02 15:16:35', NULL, true),
(7, 'emma_v', 'emma@example.com', '$2b$10$YourHashHere', 'Emma', 'Visser', 'student', 'AI & Machine Learning', NULL, NULL, 680, 7, '2026-01-02 15:16:35', NULL, true),
(8, 'thomas_d', 'thomas@example.com', '$2b$10$YourHashHere', 'Thomas', 'de Jong', 'student', 'Business Analytics', NULL, NULL, 590, 6, '2026-01-02 15:16:35', NULL, true),
(9, 'lisa_k', 'lisa@example.com', '$2b$10$YourHashHere', 'Lisa', 'Koopman', 'student', 'Information Systems', NULL, NULL, 520, 5, '2026-01-02 15:16:35', NULL, true),
(10, 'max_h', 'max@example.com', '$2b$10$YourHashHere', 'Max', 'Hendriks', 'student', 'Software Engineering', NULL, NULL, 445, 5, '2026-01-02 15:16:35', NULL, true),
(11, 'eva_s', 'eva@example.com', '$2b$10$YourHashHere', 'Eva', 'Smit', 'student', 'Data Science', NULL, NULL, 380, 4, '2026-01-02 15:16:35', NULL, true),
(12, 'daan_w', 'daan@example.com', '$2b$10$YourHashHere', 'Daan', 'de Wit', 'student', 'Computer Science', NULL, NULL, 325, 3, '2026-01-02 15:16:35', NULL, true),
(13, 'sara_m', 'sara@example.com', '$2b$10$YourHashHere', 'Sara', 'Mulder', 'student', 'AI & Machine Learning', NULL, NULL, 280, 3, '2026-01-02 15:16:35', NULL, true),
(14, 'finn_v', 'finn@example.com', '$2b$10$YourHashHere', 'Finn', 'Vos', 'student', 'Business Analytics', NULL, NULL, 215, 2, '2026-01-02 15:16:35', NULL, true);

-- Modules (4 rows)
INSERT INTO modules (id, title, description, icon, order_index, difficulty, estimated_duration, points_reward, is_published, created_at, updated_at) VALUES
(1, 'AI Basiskennis', 'Leer de fundamentele concepten achter AI, machine learning en deep learning', '🎓', 1, 'beginner', 120, 100, true, '2026-01-02 09:33:27', '2026-01-02 09:33:27'),
(2, 'AI Toepassingen', 'Ontdek hoe AI wordt toegepast in verschillende sectoren en beroepen', '🚀', 2, 'intermediate', 90, 150, true, '2026-01-02 09:33:27', '2026-01-02 09:33:27'),
(3, 'Kritisch Denken', 'Leer AI-systemen kritisch te beoordelen en ethische vragen te stellen', '🧠', 3, 'intermediate', 60, 120, true, '2026-01-02 09:33:27', '2026-01-02 09:33:27'),
(4, 'Praktische Vaardigheden', 'Ontwikkel praktische vaardigheden met AI-tools en -toepassingen', '🛠️', 4, 'advanced', 180, 200, true, '2026-01-02 09:33:27', '2026-01-02 09:33:27');

-- Content - Vervolg in volgende file vanwege lengte...
-- Badges (10 rows)
INSERT INTO badges (id, name, description, icon, badge_type, requirement_type, requirement_value, points_reward, rarity, is_active, created_at) VALUES
(1, 'AI Pioneer', 'Welkom bij AI Literacy! Begin je leerreis.', '🌟', 'special', 'points', 0, 10, 'common', true, '2026-01-02 09:33:27'),
(2, 'Knowledge Seeker', 'Lees 5 artikelen over AI', '📚', 'achievement', 'content_complete', 5, 25, 'common', true, '2026-01-02 09:33:27'),
(3, 'Ethical Thinker', 'Voltooi alle content in de Kritisch Denken module', '🧠', 'completion', 'content_complete', 10, 50, 'uncommon', true, '2026-01-02 09:33:27'),
(4, 'AI Expert', 'Bereik 500 punten', '🎓', 'achievement', 'points', 500, 100, 'rare', true, '2026-01-02 09:33:27'),
(5, 'Social Butterfly', 'Plaats 25 comments', '🦋', 'social', 'content_complete', 25, 30, 'uncommon', true, '2026-01-02 09:33:27'),
(6, 'Streak Master', 'Log 7 dagen achter elkaar in', '🔥', 'streak', 'streak_days', 7, 50, 'rare', true, '2026-01-02 09:33:27'),
(7, 'Master of AI', 'Voltooi alle modules', '👑', 'completion', 'content_complete', 30, 200, 'legendary', true, '2026-01-02 09:33:27'),
(8, 'Early Adopter', 'Een van de eerste 100 gebruikers', '🚀', 'special', 'points', 10, 25, 'epic', true, '2026-01-02 09:33:27'),
(9, 'Experimenter', 'Voltooi 3 experimenten', '🧪', 'achievement', 'content_complete', 3, 40, 'uncommon', true, '2026-01-02 09:33:27'),
(10, 'Video Enthusiast', 'Bekijk 10 videos', '📹', 'achievement', 'content_complete', 10, 35, 'common', true, '2026-01-02 09:33:27');

-- Challenges (4 rows)
INSERT INTO challenges (id, title, description, challenge_type, objective, target_value, points_reward, badge_reward_id, start_date, end_date, is_active, created_at) VALUES
(1, 'Dagelijkse Leerder', 'Voltooi vandaag 1 stuk content', 'daily', 'content_complete', 1, 15, NULL, '2026-01-02 09:33:27', '2026-01-03 09:33:27', true, '2026-01-02 09:33:27'),
(2, 'Week van AI', 'Voltooi deze week 5 stukken content', 'weekly', 'content_complete', 5, 75, NULL, '2026-01-02 09:33:27', '2026-01-09 09:33:27', true, '2026-01-02 09:33:27'),
(3, 'Maand van Groei', 'Verdien deze maand 200 punten', 'monthly', 'points', 200, 150, NULL, '2026-01-02 09:33:27', '2026-02-01 09:33:27', true, '2026-01-02 09:33:27'),
(4, 'Social Learner', 'Plaats 3 comments deze week', 'weekly', 'comment_posted', 3, 30, NULL, '2026-01-02 09:33:27', '2026-01-09 09:33:27', true, '2026-01-02 09:33:27');

-- Update sequences to match inserted IDs
SELECT setval('users_id_seq', 14, true);
SELECT setval('modules_id_seq', 4, true);
SELECT setval('badges_id_seq', 10, true);
SELECT setval('challenges_id_seq', 4, true);

-- ============================================================
-- Schema + Basic Data Complete!
-- Login credentials: admin@ailiteracy.nl / password123
-- ============================================================
