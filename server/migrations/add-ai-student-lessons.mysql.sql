CREATE TABLE IF NOT EXISTS external_lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    course_version VARCHAR(20) NOT NULL,
    external_id VARCHAR(120) NOT NULL,
    title VARCHAR(200) NOT NULL,
    lesson_url VARCHAR(500) NOT NULL,
    video_url VARCHAR(500) NULL,
    video_duration_minutes INT NULL,
    availability_status VARCHAR(20) NOT NULL,
    unavailable_reason TEXT NULL,
    content_id INT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_external_lessons_source UNIQUE (provider, course_version, external_id),
    CONSTRAINT chk_external_lessons_availability CHECK (availability_status IN ('available', 'no_video', 'upcoming')),
    CONSTRAINT fk_external_lessons_content FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE SET NULL,
    INDEX idx_external_lessons_version_status (course_version, availability_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
