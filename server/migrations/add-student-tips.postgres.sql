CREATE TABLE IF NOT EXISTS student_suggestions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id INTEGER REFERENCES content(id) ON DELETE SET NULL,
    converted_content_id INTEGER REFERENCES content(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    audience VARCHAR(200) NOT NULL,
    learning_outcome TEXT NOT NULL,
    recommendation_reason TEXT NOT NULL,
    critical_check TEXT NOT NULL,
    share_with_students BOOLEAN NOT NULL DEFAULT FALSE,
    display_first_name BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'submitted',
    reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewer_note TEXT,
    display_title VARCHAR(200),
    display_summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_suggestions_student ON student_suggestions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_suggestions_status ON student_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_student_suggestions_reviewer ON student_suggestions(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_student_suggestions_content ON student_suggestions(content_id);
CREATE INDEX IF NOT EXISTS idx_student_suggestions_converted_content ON student_suggestions(converted_content_id);
