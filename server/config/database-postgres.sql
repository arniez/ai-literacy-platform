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
