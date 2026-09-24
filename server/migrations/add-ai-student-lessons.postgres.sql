CREATE TABLE IF NOT EXISTS external_lessons (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    course_version VARCHAR(20) NOT NULL,
    external_id VARCHAR(120) NOT NULL,
    title VARCHAR(200) NOT NULL,
    lesson_url VARCHAR(500) NOT NULL,
    video_url VARCHAR(500),
    video_duration_minutes INTEGER,
    availability_status VARCHAR(20) NOT NULL,
    unavailable_reason TEXT,
    content_id INTEGER UNIQUE REFERENCES content(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_external_lessons_source UNIQUE (provider, course_version, external_id),
    CONSTRAINT chk_external_lessons_availability CHECK (availability_status IN ('available', 'no_video', 'upcoming'))
);

CREATE INDEX IF NOT EXISTS idx_external_lessons_version_status
    ON external_lessons(course_version, availability_status);
