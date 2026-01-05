-- ================================================
-- Add Content Quiz System
-- ================================================
-- This adds a quiz system for individual content items
-- Each content can have 3 quiz questions that must be answered correctly
-- before the content is marked as completed

-- Content Quiz Questions Table
CREATE TABLE IF NOT EXISTS content_quiz_questions (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT,
    explanation TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Quiz Answers for Content
CREATE TABLE IF NOT EXISTS user_content_quiz_answers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES content_quiz_questions(id) ON DELETE CASCADE,
    selected_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, question_id)
);

-- User Content Quiz Status
CREATE TABLE IF NOT EXISTS user_content_quiz_status (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    questions_answered INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 3,
    passed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    UNIQUE(user_id, content_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_quiz_questions_content ON content_quiz_questions(content_id);
CREATE INDEX IF NOT EXISTS idx_user_content_quiz_answers_user ON user_content_quiz_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_quiz_answers_content ON user_content_quiz_answers(content_id);
CREATE INDEX IF NOT EXISTS idx_user_content_quiz_status_user ON user_content_quiz_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_quiz_status_content ON user_content_quiz_status(content_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_content_quiz_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_quiz_questions_updated_at
    BEFORE UPDATE ON content_quiz_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_content_quiz_updated_at();

COMMENT ON TABLE content_quiz_questions IS 'Quiz questions for individual content items (3 questions per content)';
COMMENT ON TABLE user_content_quiz_answers IS 'User answers to content quiz questions';
COMMENT ON TABLE user_content_quiz_status IS 'Overall quiz completion status per user per content';
