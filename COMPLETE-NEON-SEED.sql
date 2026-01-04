-- AI Literacy Database Schema - PostgreSQL Version
-- Run this script to create the database and tables

-- Create database (run this separately first)
-- CREATE DATABASE ai_literacy_db WITH ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';
-- \c ai_literacy_db

-- Enable UUID extension if needed for future use
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_follows CASCADE;
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS user_submissions CASCADE;
DROP TABLE IF EXISTS content_ratings CASCADE;
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS user_challenges CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE content_type AS ENUM ('cursus', 'video', 'podcast', 'game', 'praktijkvoorbeeld', 'artikel');
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE badge_type AS ENUM ('completion', 'achievement', 'social', 'streak', 'special');
CREATE TYPE badge_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE challenge_type AS ENUM ('daily', 'weekly', 'monthly', 'special');
CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'failed');
CREATE TYPE submission_status AS ENUM ('submitted', 'graded', 'returned');
CREATE TYPE activity_type AS ENUM ('badge_earned', 'challenge_completed', 'content_completed', 'level_up', 'comment_posted', 'content_rated');
CREATE TYPE notification_type AS ENUM ('badge', 'challenge', 'comment', 'follow', 'like', 'achievement', 'system');

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role user_role DEFAULT 'student',
    study_program VARCHAR(100),
    avatar_url VARCHAR(255),
    bio TEXT,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_total_points ON users(total_points);

-- Modules Table
CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    difficulty difficulty_level DEFAULT 'beginner',
    estimated_duration INTEGER, -- in minutes
    points_reward INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_modules_order ON modules(order_index);

-- Create trigger for updated_at on modules
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Content Table
CREATE TABLE content (
    id SERIAL PRIMARY KEY,
    module_id INTEGER,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    url VARCHAR(500),
    thumbnail_url VARCHAR(255),
    duration INTEGER, -- in minutes
    difficulty difficulty_level DEFAULT 'beginner',
    points_reward INTEGER DEFAULT 0,
    tags JSONB,
    source VARCHAR(100),
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
);

CREATE INDEX idx_content_module ON content(module_id);
CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_content_difficulty ON content(difficulty);
CREATE INDEX idx_content_featured ON content(is_featured);

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User Progress Table
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    status progress_status DEFAULT 'not_started',
    progress_percentage INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- in seconds
    last_accessed TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
    UNIQUE (user_id, content_id)
);

CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Badges Table
CREATE TABLE badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    badge_type badge_type DEFAULT 'achievement',
    requirement_type VARCHAR(50), -- e.g., 'points', 'content_complete', 'streak_days'
    requirement_value INTEGER,
    points_reward INTEGER DEFAULT 0,
    rarity badge_rarity DEFAULT 'common',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_badges_type ON badges(badge_type);

-- User Badges Table
CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    badge_id INTEGER NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_displayed BOOLEAN DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at);

-- Challenges Table
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    challenge_type challenge_type DEFAULT 'daily',
    objective VARCHAR(255),
    target_value INTEGER,
    points_reward INTEGER DEFAULT 0,
    badge_reward_id INTEGER NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (badge_reward_id) REFERENCES badges(id) ON DELETE SET NULL
);

CREATE INDEX idx_challenges_active ON challenges(is_active);
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);

-- User Challenges Table
CREATE TABLE user_challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    challenge_id INTEGER NOT NULL,
    current_progress INTEGER DEFAULT 0,
    status challenge_status DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    UNIQUE (user_id, challenge_id)
);

CREATE INDEX idx_user_challenges_user_status ON user_challenges(user_id, status);

-- Comments/Discussions Table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    parent_comment_id INTEGER NULL,
    comment_text TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_content ON comments(content_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment Likes Table
CREATE TABLE comment_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    comment_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    UNIQUE (user_id, comment_id)
);

CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);

-- Content Ratings Table
CREATE TABLE content_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
    UNIQUE (user_id, content_id)
);

CREATE INDEX idx_content_ratings_content ON content_ratings(content_id);
CREATE INDEX idx_content_ratings_rating ON content_ratings(rating);

CREATE TRIGGER update_content_ratings_updated_at BEFORE UPDATE ON content_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User Submissions Table (for assignments/experiments)
CREATE TABLE user_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    submission_data JSONB,
    file_urls JSONB,
    score INTEGER,
    feedback TEXT,
    status submission_status DEFAULT 'submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_submissions_user ON user_submissions(user_id);
CREATE INDEX idx_user_submissions_content ON user_submissions(content_id);
CREATE INDEX idx_user_submissions_status ON user_submissions(status);

-- User Activities/Feed Table
CREATE TABLE user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    activity_type activity_type NOT NULL,
    activity_data JSONB,
    points_earned INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_activities_user ON user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX idx_user_activities_public ON user_activities(is_public);

-- User Follows/Connections Table
CREATE TABLE user_follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (follower_id, following_id)
);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);

-- Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    notification_type notification_type NOT NULL,
    title VARCHAR(200),
    message TEXT,
    link_url VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;
-- PostgreSQL Seed Data
-- Generated: 2026-01-03T18:51:05.141Z
-- Database: ai_literacy_db


-- users (14 rows)
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (1, 'admin', 'admin@ailiteracy.nl', '$2a$10$qSQKXNuF4C.WaUdETAkRY.Bui.bj.IxM1TCSYDXn.wSmymZ1w2.Hu', 'Admin', 'User', 'admin', 'Administration', NULL, 'AI Literacy Platform Administrator', 505, 6, '2026-01-02T09:33:27.000Z', '2026-01-02T10:15:31.000Z', true);
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (2, 'student1', 'student@student.nl', '$2a$10$qSQKXNuF4C.WaUdETAkRY.Bui.bj.IxM1TCSYDXn.wSmymZ1w2.Hu', 'Anna', 'de Vries', 'student', 'Informatica', NULL, 'Informatica student geïnteresseerd in AI', 445, 5, '2026-01-02T09:33:27.000Z', '2026-01-03T18:39:20.966Z', true);
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (3, 'student2', 'jan@student.nl', '$2a$10$qSQKXNuF4C.WaUdETAkRY.Bui.bj.IxM1TCSYDXn.wSmymZ1w2.Hu', 'Jan', 'Jansen', 'student', 'Bedrijfskunde', NULL, 'Bedrijfskunde student', 180, 2, '2026-01-02T09:33:27.000Z', NULL, true);
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (4, 'teacher1', 'teacher@teacher.nl', '$2a$10$qSQKXNuF4C.WaUdETAkRY.Bui.bj.IxM1TCSYDXn.wSmymZ1w2.Hu', 'Prof.', 'Peters', 'teacher', 'Docent', NULL, 'Docent AI en Machine Learning', 450, 5, '2026-01-02T09:33:27.000Z', NULL, true);
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (5, 'sophie_m', 'sophie@example.com', '$2b$10$YourHashHere', 'Sophie', 'Martens', 'student', 'Data Science', NULL, NULL, 820, 9, '2026-01-02T15:16:35.000Z', NULL, true);
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (6, 'lucas_b', 'lucas@example.com', '$2b$10$YourHashHere', 'Lucas', 'Bakker', 'student', 'Computer Science', NULL, NULL, 750, 8, '2026-01-02T15:16:35.000Z', NULL, true);
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (7, 'emma_v', 'emma@example.com', '$2b$10$YourHashHere', 'Emma', 'Visser', 'student', 'AI & Machine Learning', NULL, NULL, 680, 7, '2026-01-02T15:16:35.000Z', NULL, true);
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (8, 'thomas_d', 'thomas@example.com', '$2b$10$YourHashHere', 'Thomas', 'de Jong', 'student', 'Business Analytics', NULL, NULL, 590, 6, '2026-01-02T15:16:35.000Z', NULL, true);
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (9, 'lisa_k', 'lisa@example.com', '$2b$10$YourHashHere', 'Lisa', 'Koopman', 'student', 'Information Systems', NULL, NULL, 520, 5, '2026-01-02T15:16:35.000Z', NULL, true);
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (10, 'max_h', 'max@example.com', '$2b$10$YourHashHere', 'Max', 'Hendriks', 'student', 'Software Engineering', NULL, NULL, 445, 5, '2026-01-02T15:16:35.000Z', NULL, true);
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (11, 'eva_s', 'eva@example.com', '$2b$10$YourHashHere', 'Eva', 'Smit', 'student', 'Data Science', NULL, NULL, 380, 4, '2026-01-02T15:16:35.000Z', NULL, true);
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (12, 'daan_w', 'daan@example.com', '$2b$10$YourHashHere', 'Daan', 'de Wit', 'student', 'Computer Science', NULL, NULL, 325, 3, '2026-01-02T15:16:35.000Z', NULL, true);
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (13, 'sara_m', 'sara@example.com', '$2b$10$YourHashHere', 'Sara', 'Mulder', 'student', 'AI & Machine Learning', NULL, NULL, 280, 3, '2026-01-02T15:16:35.000Z', NULL, true);
INSERT INTO users (id, username, email, password, first_name, last_name, role, study_program, avatar_url, bio, total_points, level, created_at, last_login, is_active) VALUES (14, 'finn_v', 'finn@example.com', '$2b$10$YourHashHere', 'Finn', 'Vos', 'student', 'Business Analytics', NULL, NULL, 215, 2, '2026-01-02T15:16:35.000Z', NULL, true);

-- modules (4 rows)
INSERT INTO modules (id, title, description, icon, order_index, difficulty, estimated_duration, points_reward, is_published, created_at, updated_at) VALUES (1, 'AI Basiskennis', 'Leer de fundamentele concepten achter AI, machine learning en deep learning', '🎓', 1, 'beginner', 120, 100, true, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO modules (id, title, description, icon, order_index, difficulty, estimated_duration, points_reward, is_published, created_at, updated_at) VALUES (2, 'AI Toepassingen', 'Ontdek hoe AI wordt toegepast in verschillende sectoren en beroepen', '🚀', 2, 'intermediate', 90, 150, true, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO modules (id, title, description, icon, order_index, difficulty, estimated_duration, points_reward, is_published, created_at, updated_at) VALUES (3, 'Kritisch Denken', 'Leer AI-systemen kritisch te beoordelen en ethische vragen te stellen', '🧠', 3, 'intermediate', 60, 120, true, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO modules (id, title, description, icon, order_index, difficulty, estimated_duration, points_reward, is_published, created_at, updated_at) VALUES (4, 'Praktische Vaardigheden', 'Ontwikkel praktische vaardigheden met AI-tools en -toepassingen', '🛠️', 4, 'advanced', 180, 200, true, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');

-- content (37 rows)
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (1, 1, 'AI Basiskennis Cursus', 'Leer de fundamentele concepten achter AI, machine learning en deep learning.', 'cursus', 'https://www.elementsofai.com', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500', 120, 'beginner', 50, '["basis"]'::jsonb, 'ai-cursus', true, true, 5, '4.50', 2, '2026-01-02T09:33:27.000Z', '2026-01-03T16:50:31.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (2, 1, 'Elements of AI', 'Een gratis online cursus om AI begrijpelijker te maken voor een breder publiek.', 'cursus', 'https://www.elementsofai.com', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500', 180, 'beginner', 60, '["basis"]'::jsonb, 'elementofai', true, true, 0, '4.50', 402, '2026-01-02T09:33:27.000Z', '2026-01-02T13:36:34.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (3, 1, 'AI in het Onderwijs Podcast', 'Een podcast over hoe AI het onderwijs transformeert en welke kansen er liggen.', 'podcast', 'https://open.spotify.com/show/ai-onderwijs', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500', 45, 'beginner', 25, '["basis"]'::jsonb, 'spotify', false, true, 0, '3.80', 189, '2026-01-02T09:33:27.000Z', '2026-01-02T13:36:34.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (4, 2, 'Predictive Maintenance bij NS: AI voor Onderhoud Treinstellen', 'Praktijkvoorbeeld: Hoe de Nederlandse Spoorwegen storingsdata en sensorgegevens gebruikt met AI om onderhoud te voorspellen en defecten voor te zijn.', 'praktijkvoorbeeld', '/cases/ns-predictive-maintenance', 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=500', 35, 'intermediate', 40, '["internal","transport"]'::jsonb, 'internal', true, true, 2, '4.30', 142, '2026-01-02T09:33:27.000Z', '2026-01-02T14:30:44.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (5, 2, 'AI in de Gezondheidszorg: Vroegdiagnostiek', 'Praktijkvoorbeeld: Hoe RadboudUMC AI gebruikt voor vroege detectie van longkanker via CT-scans.', 'praktijkvoorbeeld', '/cases/radboud-vroegdiagnostiek', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500', 45, 'intermediate', 45, '["internal","healthcare"]'::jsonb, 'internal', false, true, 0, '4.40', 187, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (6, 2, 'Introductie tot Machine Learning', 'Video uitleg over de basis van machine learning en hoe het werkt.', 'video', 'https://youtube.com/watch?v=ml-intro', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=500', 25, 'beginner', 30, '["youtube","ml"]'::jsonb, 'youtube', false, true, 0, '4.10', 298, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (7, 3, 'Praktijkworkshop: AI in Financiële Fraudedetectie', 'Interactieve workshop over hoe Rabobank machine learning inzet voor het detecteren van ongebruikelijke transacties en fraude.', 'praktijkvoorbeeld', '/cases/rabobank-fraud-detection', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500', 120, 'advanced', 80, '["internal","finance","workshop"]'::jsonb, 'internal', true, true, 0, '4.70', 89, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (8, 3, 'Ethics in AI Game', 'Een interactief spel waarin je ethische dilemmas rond AI moet oplossen.', 'game', '/games/ethics-ai', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500', 30, 'intermediate', 35, '["game","ethics"]'::jsonb, 'internal', false, true, 0, '4.00', 256, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (9, 4, 'ChatGPT voor Professionals', 'Leer hoe je ChatGPT effectief kunt inzetten in je dagelijkse werk.', 'cursus', 'https://learn.deeplearning.ai/chatgpt-prompt-eng', 'https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=500', 60, 'intermediate', 50, '["chatgpt","prompting"]'::jsonb, 'deeplearning.ai', true, true, 0, '4.60', 523, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (10, 4, 'AI Muziekgenerator Experiment', 'Experimenteer met AI om je eigen muziek te creëren.', 'game', '/experiments/music-generator', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500', 30, 'beginner', 30, '["music","creative"]'::jsonb, 'internal', false, true, 0, '4.20', 145, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (11, 1, 'Neural Networks Explained', 'Visuele uitleg over hoe neurale netwerken werken, van input tot output. Begrijp de basis van deep learning.', 'video', 'https://www.youtube.com/watch?v=aircAruvnKk', 'https://images.unsplash.com/photo-1620825937374-87fc7d6bddc2?w=500', 19, 'beginner', 40, '["basis"]'::jsonb, 'youtube', true, true, 9, '4.00', 1, '2026-01-02T09:52:39.000Z', '2026-01-03T16:50:17.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (12, 1, 'AI vs Machine Learning vs Deep Learning', 'Begrijp de verschillen tussen AI, Machine Learning en Deep Learning met praktische voorbeelden.', 'artikel', '/articles/ai-ml-dl-differences', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500', 15, 'beginner', 30, '["basis"]'::jsonb, 'internal', false, true, 2, '4.30', 234, '2026-01-02T09:52:39.000Z', '2026-01-02T13:41:20.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (13, 1, 'Hoe ChatGPT Werkt', 'Een toegankelijke podcast over de technologie achter ChatGPT en andere taalmodellen.', 'podcast', 'https://open.spotify.com/episode/chatgpt-explained', 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=500', 35, 'beginner', 35, '["basis"]'::jsonb, 'spotify', false, true, 0, '4.60', 445, '2026-01-02T09:52:39.000Z', '2026-01-02T13:36:34.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (14, 1, 'Interactive AI Playground', 'Experimenteer met verschillende AI-modellen en zie direct de resultaten. Leer door te doen!', 'game', '/games/ai-playground', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500', 45, 'intermediate', 50, '["interactive","hands-on"]'::jsonb, 'internal', true, true, 2, '4.70', 312, '2026-01-02T09:52:39.000Z', '2026-01-02T14:31:02.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (15, 2, 'AI in de Retail: Bol.com Aanbevelingssysteem', 'Case study: Hoe Bol.com machine learning gebruikt om producten aan te bevelen aan klanten.', 'praktijkvoorbeeld', '/cases/bolcom-recommendations', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500', 30, 'intermediate', 45, '["internal","retail","recommendations"]'::jsonb, 'internal', true, true, 2, '4.50', 178, '2026-01-02T09:52:39.000Z', '2026-01-03T16:48:20.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (16, 2, 'Computer Vision: Objectherkenning', 'Leer hoe computers afbeeldingen kunnen analyseren en objecten kunnen herkennen met behulp van AI.', 'video', 'https://www.youtube.com/watch?v=computer-vision', 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=500', 22, 'intermediate', 40, '["computer-vision","image-recognition"]'::jsonb, 'youtube', false, true, 0, '4.40', 289, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (17, 2, 'Spraakherkenning en NLP', 'Ontdek hoe AI menselijke taal begrijpt via Natural Language Processing en spraakherkenning.', 'cursus', 'https://www.coursera.org/learn/nlp-basics', 'https://images.unsplash.com/photo-1589254066213-a0c9dc853511?w=500', 120, 'intermediate', 60, '["nlp","speech-recognition","coursera"]'::jsonb, 'coursera', false, true, 0, '4.60', 401, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (18, 2, 'AI in de Landbouw: Precisielandbouw', 'Praktijkvoorbeeld: Hoe Nederlandse boeren AI en drones gebruiken voor precisielandbouw en opbrengstoptimalisatie.', 'praktijkvoorbeeld', '/cases/precision-farming', 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500', 35, 'intermediate', 45, '["internal","agriculture","sustainability"]'::jsonb, 'internal', false, true, 0, '4.20', 156, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (19, 2, 'Robotica en AI', 'Video over hoe AI robots slimmer maakt en autonome systemen mogelijk maakt.', 'video', 'https://www.youtube.com/watch?v=robotics-ai', 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=500', 18, 'beginner', 35, '["robotics","automation"]'::jsonb, 'youtube', false, true, 0, '4.30', 267, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (20, 3, 'AI Bias en Discriminatie', 'Begrijp hoe AI-systemen vooroordelen kunnen hebben en wat we eraan kunnen doen.', 'artikel', '/articles/ai-bias', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500', 20, 'intermediate', 40, '["ethics","bias","fairness"]'::jsonb, 'internal', true, true, 0, '4.70', 334, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (21, 3, 'Privacy in het AI-tijdperk', 'Podcast over privacy-uitdagingen bij AI en hoe we onze data kunnen beschermen.', 'podcast', 'https://open.spotify.com/episode/ai-privacy', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500', 40, 'intermediate', 40, '["privacy","data-protection","spotify"]'::jsonb, 'spotify', false, true, 0, '4.50', 267, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (22, 3, 'Deepfakes Herkennen', 'Interactief spel waarbij je leert onderscheid te maken tussen echte en AI-gegenereerde content.', 'game', '/games/deepfake-detector', 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=500', 25, 'intermediate', 40, '["deepfakes","media-literacy"]'::jsonb, 'internal', true, true, 2, '4.60', 445, '2026-01-02T09:52:39.000Z', '2026-01-02T17:58:04.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (23, 3, 'AI Governance en Wetgeving', 'Cursus over AI-regelgeving, de EU AI Act en ethische richtlijnen voor AI-ontwikkeling.', 'cursus', '/courses/ai-governance', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500', 90, 'advanced', 70, '["governance","regulation","ai-act"]'::jsonb, 'internal', false, true, 0, '4.40', 189, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (24, 3, 'Explainable AI (XAI)', 'Leer waarom transparantie in AI belangrijk is en hoe Explainable AI werkt.', 'video', 'https://www.youtube.com/watch?v=explainable-ai', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500', 28, 'advanced', 50, '["xai","transparency","interpretability"]'::jsonb, 'youtube', false, true, 0, '4.50', 223, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (25, 4, 'Prompt Engineering Masterclass', 'Leer geavanceerde technieken voor het schrijven van effectieve prompts voor ChatGPT en andere AI-tools.', 'cursus', '/courses/prompt-engineering-advanced', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500', 150, 'intermediate', 80, '["prompting","chatgpt","hands-on"]'::jsonb, 'internal', true, true, 0, '4.80', 678, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (26, 4, 'AI Tools voor Onderzoek', 'Ontdek AI-tools die je kunnen helpen bij literatuuronderzoek, data-analyse en rapportage.', 'video', 'https://www.youtube.com/watch?v=ai-research-tools', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500', 32, 'intermediate', 45, '["research","productivity","tools"]'::jsonb, 'youtube', false, true, 0, '4.60', 389, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (27, 4, 'AI Beeldgenerator Workshop', 'Hands-on workshop met DALL-E, Midjourney en Stable Diffusion. Creëer je eigen AI-kunstwerken.', 'praktijkvoorbeeld', '/workshops/ai-image-generation', 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=500', 120, 'intermediate', 75, '["internal","image-generation","creative","workshop"]'::jsonb, 'internal', true, true, 7, '4.90', 534, '2026-01-02T09:52:39.000Z', '2026-01-03T16:49:22.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (28, 4, 'Data Science Basics', 'Leer de fundamenten van data science en hoe je data voorbereidt voor machine learning.', 'cursus', 'https://www.datacamp.com/courses/intro-to-data-science', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500', 180, 'intermediate', 90, '["data-science","python","datacamp"]'::jsonb, 'datacamp', false, true, 0, '4.70', 456, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (29, 4, 'AI Coding Assistant: GitHub Copilot', 'Praktische tutorial over het gebruik van AI als programmeerassistent met GitHub Copilot.', 'video', 'https://www.youtube.com/watch?v=github-copilot', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500', 25, 'intermediate', 40, '["coding","copilot","development"]'::jsonb, 'youtube', false, true, 0, '4.50', 312, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (30, 4, 'AI Voice Cloning Experiment', 'Experimenteer met voice cloning technologie en leer over de mogelijkheden en risicos.', 'game', '/experiments/voice-cloning', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500', 35, 'advanced', 50, '["voice","audio","experiment"]'::jsonb, 'internal', false, true, 0, '4.30', 234, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (31, 2, 'AI in de Zorg: Diagnostische Ondersteuning', 'Case study: Hoe Amsterdam UMC AI inzet voor medische beeldanalyse en vroegdiagnostiek.', 'praktijkvoorbeeld', '/cases/amc-diagnostics', 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500', 40, 'intermediate', 50, '["internal","healthcare","diagnostics"]'::jsonb, 'internal', false, true, 0, '4.60', 201, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (32, 2, 'KLM: AI voor Vliegtuigonderhoud', 'Praktijkvoorbeeld: Predictive maintenance bij KLM om vliegtuigdefecten te voorspellen en downtime te minimaliseren.', 'praktijkvoorbeeld', '/cases/klm-predictive-maintenance', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500', 35, 'intermediate', 45, '["internal","aviation","maintenance"]'::jsonb, 'internal', false, true, 0, '4.40', 167, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (33, 2, 'AI in Financiële Dienstverlening', 'Hoe banken AI gebruiken voor kredietbeoordeling, fraudedetectie en klantenservice.', 'video', 'https://www.youtube.com/watch?v=ai-finance', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500', 28, 'intermediate', 40, '["finance","banking","fintech"]'::jsonb, 'youtube', false, true, 0, '4.30', 278, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (34, 1, 'AI Mythes Ontkracht', 'Podcast waarin veelvoorkomende misvattingen over AI worden rechtgezet door experts.', 'podcast', 'https://open.spotify.com/episode/ai-myths', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500', 42, 'beginner', 35, '["myths","facts","spotify"]'::jsonb, 'spotify', false, true, 0, '4.40', 356, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (35, 3, 'AI en Duurzaamheid', 'Podcast over hoe AI kan bijdragen aan klimaatdoelen en duurzame ontwikkeling.', 'podcast', 'https://open.spotify.com/episode/ai-sustainability', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=500', 38, 'intermediate', 40, '["sustainability","climate","spotify"]'::jsonb, 'spotify', true, true, 28, '4.00', 1, '2026-01-02T09:52:39.000Z', '2026-01-03T16:49:15.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (36, 4, 'AI Decision Making Simulator', 'Simuleer AI-beslissingen in verschillende scenario''s en begrijp de consequenties.', 'game', '/games/ai-decision-simulator', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=500', 40, 'intermediate', 50, '["decision-making","simulation","interactive"]'::jsonb, 'internal', false, true, 0, '4.50', 289, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');
INSERT INTO content (id, module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, is_published, view_count, rating_avg, rating_count, created_at, updated_at) VALUES (37, 3, 'Algoritme Bias Test', 'Test je eigen vooroordelen en leer hoe deze in AI-systemen kunnen sluipen.', 'game', '/games/bias-test', 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=500', 20, 'beginner', 30, '["bias","awareness","self-test"]'::jsonb, 'internal', false, true, 0, '4.60', 501, '2026-01-02T09:52:39.000Z', '2026-01-02T09:52:39.000Z');

-- user_progress (11 rows)
INSERT INTO user_progress (id, user_id, content_id, status, progress_percentage, time_spent, last_accessed, completed_at, notes, created_at, updated_at) VALUES (1, 2, 1, 'in_progress', 0, 7200, '2026-01-03T16:50:31.000Z', '2025-12-28T09:33:27.000Z', NULL, '2026-01-02T09:33:27.000Z', '2026-01-03T16:50:31.000Z');
INSERT INTO user_progress (id, user_id, content_id, status, progress_percentage, time_spent, last_accessed, completed_at, notes, created_at, updated_at) VALUES (2, 2, 2, 'completed', 100, 10800, '2025-12-30T09:33:27.000Z', '2025-12-30T09:33:27.000Z', NULL, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO user_progress (id, user_id, content_id, status, progress_percentage, time_spent, last_accessed, completed_at, notes, created_at, updated_at) VALUES (3, 2, 3, 'in_progress', 60, 1620, '2026-01-02T09:33:27.000Z', NULL, NULL, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO user_progress (id, user_id, content_id, status, progress_percentage, time_spent, last_accessed, completed_at, notes, created_at, updated_at) VALUES (4, 3, 1, 'completed', 100, 8100, '2025-12-23T09:33:27.000Z', '2025-12-23T09:33:27.000Z', NULL, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO user_progress (id, user_id, content_id, status, progress_percentage, time_spent, last_accessed, completed_at, notes, created_at, updated_at) VALUES (5, 3, 4, 'in_progress', 45, 945, '2026-01-01T09:33:27.000Z', NULL, NULL, '2026-01-02T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO user_progress (id, user_id, content_id, status, progress_percentage, time_spent, last_accessed, completed_at, notes, created_at, updated_at) VALUES (6, 1, 35, 'in_progress', 0, 0, '2026-01-02T10:38:26.000Z', NULL, NULL, '2026-01-02T10:15:39.000Z', '2026-01-02T10:38:26.000Z');
INSERT INTO user_progress (id, user_id, content_id, status, progress_percentage, time_spent, last_accessed, completed_at, notes, created_at, updated_at) VALUES (7, 1, 27, 'in_progress', 0, 0, '2026-01-02T10:39:12.000Z', NULL, NULL, '2026-01-02T10:39:12.000Z', '2026-01-02T10:39:12.000Z');
INSERT INTO user_progress (id, user_id, content_id, status, progress_percentage, time_spent, last_accessed, completed_at, notes, created_at, updated_at) VALUES (8, 2, 11, 'completed', 100, 0, '2026-01-03T16:50:17.000Z', '2026-01-03T16:50:17.000Z', NULL, '2026-01-02T13:29:03.000Z', '2026-01-03T16:50:17.000Z');
INSERT INTO user_progress (id, user_id, content_id, status, progress_percentage, time_spent, last_accessed, completed_at, notes, created_at, updated_at) VALUES (9, 2, 15, 'in_progress', 0, 0, '2026-01-03T16:48:20.000Z', NULL, NULL, '2026-01-03T16:48:20.000Z', '2026-01-03T16:48:20.000Z');
INSERT INTO user_progress (id, user_id, content_id, status, progress_percentage, time_spent, last_accessed, completed_at, notes, created_at, updated_at) VALUES (10, 2, 35, 'completed', 100, 0, '2026-01-03T16:49:15.000Z', '2026-01-03T16:49:15.000Z', NULL, '2026-01-03T16:49:06.000Z', '2026-01-03T16:49:15.000Z');
INSERT INTO user_progress (id, user_id, content_id, status, progress_percentage, time_spent, last_accessed, completed_at, notes, created_at, updated_at) VALUES (11, 2, 27, 'in_progress', 0, 0, '2026-01-03T16:49:22.000Z', NULL, NULL, '2026-01-03T16:49:22.000Z', '2026-01-03T16:49:22.000Z');

-- user_badges (8 rows)
INSERT INTO user_badges (id, user_id, badge_id, earned_at, is_displayed) VALUES (1, 1, 1, '2025-12-23T09:33:27.000Z', true);
INSERT INTO user_badges (id, user_id, badge_id, earned_at, is_displayed) VALUES (2, 1, 2, '2025-12-25T09:33:27.000Z', true);
INSERT INTO user_badges (id, user_id, badge_id, earned_at, is_displayed) VALUES (3, 1, 4, '2025-12-28T09:33:27.000Z', true);
INSERT INTO user_badges (id, user_id, badge_id, earned_at, is_displayed) VALUES (4, 2, 1, '2025-12-18T09:33:27.000Z', true);
INSERT INTO user_badges (id, user_id, badge_id, earned_at, is_displayed) VALUES (5, 2, 2, '2025-12-21T09:33:27.000Z', true);
INSERT INTO user_badges (id, user_id, badge_id, earned_at, is_displayed) VALUES (6, 3, 1, '2025-12-13T09:33:27.000Z', true);
INSERT INTO user_badges (id, user_id, badge_id, earned_at, is_displayed) VALUES (7, 2, 8, '2026-01-02T13:29:39.000Z', true);
INSERT INTO user_badges (id, user_id, badge_id, earned_at, is_displayed) VALUES (8, 2, 9, '2026-01-02T13:29:39.000Z', true);

-- badges (10 rows)
INSERT INTO badges (id, name, description, icon, badge_type, requirement_type, requirement_value, points_reward, rarity, is_active, created_at) VALUES (1, 'AI Pioneer', 'Welkom bij AI Literacy! Begin je leerreis.', '🌟', 'special', 'points', 0, 10, 'common', true, '2026-01-02T09:33:27.000Z');
INSERT INTO badges (id, name, description, icon, badge_type, requirement_type, requirement_value, points_reward, rarity, is_active, created_at) VALUES (2, 'Knowledge Seeker', 'Lees 5 artikelen over AI', '📚', 'achievement', 'content_complete', 5, 25, 'common', true, '2026-01-02T09:33:27.000Z');
INSERT INTO badges (id, name, description, icon, badge_type, requirement_type, requirement_value, points_reward, rarity, is_active, created_at) VALUES (3, 'Ethical Thinker', 'Voltooi alle content in de Kritisch Denken module', '🧠', 'completion', 'content_complete', 10, 50, 'uncommon', true, '2026-01-02T09:33:27.000Z');
INSERT INTO badges (id, name, description, icon, badge_type, requirement_type, requirement_value, points_reward, rarity, is_active, created_at) VALUES (4, 'AI Expert', 'Bereik 500 punten', '🎓', 'achievement', 'points', 500, 100, 'rare', true, '2026-01-02T09:33:27.000Z');
INSERT INTO badges (id, name, description, icon, badge_type, requirement_type, requirement_value, points_reward, rarity, is_active, created_at) VALUES (5, 'Social Butterfly', 'Plaats 25 comments', '🦋', 'social', 'content_complete', 25, 30, 'uncommon', true, '2026-01-02T09:33:27.000Z');
INSERT INTO badges (id, name, description, icon, badge_type, requirement_type, requirement_value, points_reward, rarity, is_active, created_at) VALUES (6, 'Streak Master', 'Log 7 dagen achter elkaar in', '🔥', 'streak', 'streak_days', 7, 50, 'rare', true, '2026-01-02T09:33:27.000Z');
INSERT INTO badges (id, name, description, icon, badge_type, requirement_type, requirement_value, points_reward, rarity, is_active, created_at) VALUES (7, 'Master of AI', 'Voltooi alle modules', '👑', 'completion', 'content_complete', 30, 200, 'legendary', true, '2026-01-02T09:33:27.000Z');
INSERT INTO badges (id, name, description, icon, badge_type, requirement_type, requirement_value, points_reward, rarity, is_active, created_at) VALUES (8, 'Early Adopter', 'Een van de eerste 100 gebruikers', '🚀', 'special', 'points', 10, 25, 'epic', true, '2026-01-02T09:33:27.000Z');
INSERT INTO badges (id, name, description, icon, badge_type, requirement_type, requirement_value, points_reward, rarity, is_active, created_at) VALUES (9, 'Experimenter', 'Voltooi 3 experimenten', '🧪', 'achievement', 'content_complete', 3, 40, 'uncommon', true, '2026-01-02T09:33:27.000Z');
INSERT INTO badges (id, name, description, icon, badge_type, requirement_type, requirement_value, points_reward, rarity, is_active, created_at) VALUES (10, 'Video Enthusiast', 'Bekijk 10 videos', '📹', 'achievement', 'content_complete', 10, 35, 'common', true, '2026-01-02T09:33:27.000Z');

-- challenges (4 rows)
INSERT INTO challenges (id, title, description, challenge_type, objective, target_value, points_reward, badge_reward_id, start_date, end_date, is_active, created_at) VALUES (1, 'Dagelijkse Leerder', 'Voltooi vandaag 1 stuk content', 'daily', 'content_complete', 1, 15, NULL, '2026-01-02T09:33:27.000Z', '2026-01-03T09:33:27.000Z', true, '2026-01-02T09:33:27.000Z');
INSERT INTO challenges (id, title, description, challenge_type, objective, target_value, points_reward, badge_reward_id, start_date, end_date, is_active, created_at) VALUES (2, 'Week van AI', 'Voltooi deze week 5 stukken content', 'weekly', 'content_complete', 5, 75, NULL, '2026-01-02T09:33:27.000Z', '2026-01-09T09:33:27.000Z', true, '2026-01-02T09:33:27.000Z');
INSERT INTO challenges (id, title, description, challenge_type, objective, target_value, points_reward, badge_reward_id, start_date, end_date, is_active, created_at) VALUES (3, 'Maand van Groei', 'Verdien deze maand 200 punten', 'monthly', 'points', 200, 150, NULL, '2026-01-02T09:33:27.000Z', '2026-02-01T09:33:27.000Z', true, '2026-01-02T09:33:27.000Z');
INSERT INTO challenges (id, title, description, challenge_type, objective, target_value, points_reward, badge_reward_id, start_date, end_date, is_active, created_at) VALUES (4, 'Social Learner', 'Plaats 3 comments deze week', 'weekly', 'comment_posted', 3, 30, NULL, '2026-01-02T09:33:27.000Z', '2026-01-09T09:33:27.000Z', true, '2026-01-02T09:33:27.000Z');

-- comments (4 rows)
INSERT INTO comments (id, user_id, content_id, parent_comment_id, comment_text, likes_count, is_edited, created_at, updated_at) VALUES (1, 2, 1, NULL, 'Geweldige cursus! Heel duidelijk uitgelegd.', 5, false, '2025-12-29T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO comments (id, user_id, content_id, parent_comment_id, comment_text, likes_count, is_edited, created_at, updated_at) VALUES (2, 3, 1, NULL, 'Ik vond het soms wat complex, maar uiteindelijk heel leerzaam.', 3, false, '2025-12-30T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO comments (id, user_id, content_id, parent_comment_id, comment_text, likes_count, is_edited, created_at, updated_at) VALUES (3, 2, 2, NULL, 'Elements of AI is echt een aanrader voor beginners!', 8, false, '2025-12-31T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO comments (id, user_id, content_id, parent_comment_id, comment_text, likes_count, is_edited, created_at, updated_at) VALUES (4, 4, 4, NULL, 'Interessant praktijkvoorbeeld, heel relevant voor mijn werk.', 6, false, '2026-01-01T09:33:27.000Z', '2026-01-02T09:33:27.000Z');

-- content_ratings (5 rows)
INSERT INTO content_ratings (id, user_id, content_id, rating, review_text, created_at, updated_at) VALUES (1, 2, 1, 5, 'strak', '2025-12-28T09:33:27.000Z', '2026-01-02T14:07:34.000Z');
INSERT INTO content_ratings (id, user_id, content_id, rating, review_text, created_at, updated_at) VALUES (2, 3, 1, 4, 'Goed, maar soms wat langdradig.', '2025-12-23T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO content_ratings (id, user_id, content_id, rating, review_text, created_at, updated_at) VALUES (3, 2, 2, 5, 'Beste online AI cursus die ik heb gevolgd.', '2025-12-30T09:33:27.000Z', '2026-01-02T09:33:27.000Z');
INSERT INTO content_ratings (id, user_id, content_id, rating, review_text, created_at, updated_at) VALUES (4, 1, 35, 4, 'mooi', '2026-01-02T10:38:45.000Z', '2026-01-02T10:38:45.000Z');
INSERT INTO content_ratings (id, user_id, content_id, rating, review_text, created_at, updated_at) VALUES (5, 2, 11, 4, 'mooi', '2026-01-02T13:29:02.000Z', '2026-01-02T13:29:02.000Z');

-- notifications (9 rows)
INSERT INTO notifications (id, user_id, notification_type, title, message, link_url, is_read, created_at) VALUES (1, 2, 'badge', 'New Badge Earned!', 'You earned the "Knowledge Seeker" badge!', '/badges', false, '2026-01-01T09:33:27.000Z');
INSERT INTO notifications (id, user_id, notification_type, title, message, link_url, is_read, created_at) VALUES (2, 2, 'achievement', 'Content Completed!', 'You earned 60 points!', '/dashboard', true, '2025-12-30T09:33:27.000Z');
INSERT INTO notifications (id, user_id, notification_type, title, message, link_url, is_read, created_at) VALUES (3, 3, 'system', 'Welcome to AI Literacy!', 'Start your journey by exploring learning materials', '/leermaterialen', true, '2025-12-13T09:33:27.000Z');
INSERT INTO notifications (id, user_id, notification_type, title, message, link_url, is_read, created_at) VALUES (4, 2, 'achievement', 'Content Completed!', 'You earned 40 points!', NULL, false, '2026-01-02T13:29:39.000Z');
INSERT INTO notifications (id, user_id, notification_type, title, message, link_url, is_read, created_at) VALUES (5, 2, 'badge', 'New Badge Earned!', 'You earned the "Early Adopter" badge!', NULL, false, '2026-01-02T13:29:39.000Z');
INSERT INTO notifications (id, user_id, notification_type, title, message, link_url, is_read, created_at) VALUES (6, 2, 'badge', 'New Badge Earned!', 'You earned the "Experimenter" badge!', NULL, false, '2026-01-02T13:29:39.000Z');
INSERT INTO notifications (id, user_id, notification_type, title, message, link_url, is_read, created_at) VALUES (7, 2, 'achievement', 'Content Completed!', 'You earned 40 points!', NULL, false, '2026-01-03T16:49:15.000Z');
INSERT INTO notifications (id, user_id, notification_type, title, message, link_url, is_read, created_at) VALUES (8, 2, 'achievement', 'Level Up!', 'Congratulations! You reached level 5', NULL, false, '2026-01-03T16:49:15.000Z');
INSERT INTO notifications (id, user_id, notification_type, title, message, link_url, is_read, created_at) VALUES (9, 2, 'achievement', 'Content Completed!', 'You earned 40 points!', NULL, false, '2026-01-03T16:50:17.000Z');

-- Update sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);
SELECT setval('modules_id_seq', (SELECT MAX(id) FROM modules), true);
SELECT setval('content_id_seq', (SELECT MAX(id) FROM content), true);
SELECT setval('user_progress_id_seq', (SELECT MAX(id) FROM user_progress), true);
SELECT setval('user_badges_id_seq', (SELECT MAX(id) FROM user_badges), true);
SELECT setval('badges_id_seq', (SELECT MAX(id) FROM badges), true);
SELECT setval('challenges_id_seq', (SELECT MAX(id) FROM challenges), true);
SELECT setval('user_challenges_id_seq', (SELECT MAX(id) FROM user_challenges), true);
SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments), true);
SELECT setval('content_ratings_id_seq', (SELECT MAX(id) FROM content_ratings), true);
SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications), true);
