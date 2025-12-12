-- Better Auth Database Schema
-- For Physical AI & Humanoid Robotics Book Project

-- ============================================
-- Better Auth Tables (auto-created by Better Auth)
-- ============================================
-- users, sessions, accounts, verification_tokens
-- These are created automatically by Better Auth

-- ============================================
-- Extended User Profile Tables
-- ============================================

-- User background profile for personalization
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,

    -- Software Background
    programming_experience VARCHAR(50) CHECK (programming_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
    known_languages TEXT[],
    ml_experience VARCHAR(50) CHECK (ml_experience IN ('none', 'basic', 'intermediate', 'advanced')),
    ros_experience VARCHAR(50) CHECK (ros_experience IN ('none', 'basic', 'intermediate', 'advanced')),

    -- Hardware Background
    robotics_experience VARCHAR(50) CHECK (robotics_experience IN ('none', 'hobbyist', 'professional', 'expert')),
    electronics_knowledge VARCHAR(50) CHECK (electronics_knowledge IN ('none', 'basic', 'intermediate', 'advanced')),
    has_robot_hardware BOOLEAN DEFAULT FALSE,
    hardware_platforms TEXT[],

    -- Learning Preferences
    learning_style VARCHAR(50) CHECK (learning_style IN ('visual', 'hands-on', 'theoretical', 'mixed')),
    preferred_pace VARCHAR(50) CHECK (preferred_pace IN ('slow', 'moderate', 'fast')),
    goals TEXT[],

    -- Metadata
    completed_onboarding BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress tracking per chapter
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    chapter_id VARCHAR(255) NOT NULL,

    -- Progress metrics
    completed BOOLEAN DEFAULT FALSE,
    time_spent_seconds INTEGER DEFAULT 0,
    last_position INTEGER DEFAULT 0,
    scroll_percentage DECIMAL(5,2) DEFAULT 0,

    -- Engagement metrics
    code_examples_tried INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    chatbot_interactions INTEGER DEFAULT 0,

    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, chapter_id)
);

-- User bookmarks for quick access
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    chapter_id VARCHAR(255) NOT NULL,
    section_id VARCHAR(255),
    section_title VARCHAR(500),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, chapter_id, section_id)
);

-- User notes for chapters
CREATE TABLE IF NOT EXISTS user_notes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    chapter_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    selected_text TEXT,
    position_in_chapter INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements/badges
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    achievement_type VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, achievement_type)
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_chapter_id ON user_progress(chapter_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(completed);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_chapter_id ON user_notes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- ============================================
-- Triggers for Updated Timestamps
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_notes
CREATE TRIGGER update_user_notes_updated_at
    BEFORE UPDATE ON user_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Achievements
-- ============================================

-- You can insert default achievements here
-- INSERT INTO achievements (type, name, description) VALUES
-- ('first_chapter', 'Getting Started', 'Complete your first chapter'),
-- ('module_complete', 'Module Master', 'Complete an entire module'),
-- etc.

-- ============================================
-- Views for Analytics
-- ============================================

-- User progress summary view
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT
    user_id,
    COUNT(*) as total_chapters_started,
    COUNT(*) FILTER (WHERE completed = true) as chapters_completed,
    SUM(time_spent_seconds) as total_time_seconds,
    SUM(code_examples_tried) as total_code_examples,
    SUM(exercises_completed) as total_exercises,
    SUM(chatbot_interactions) as total_chatbot_uses,
    MAX(last_accessed) as last_activity
FROM user_progress
GROUP BY user_id;

-- User engagement metrics view
CREATE OR REPLACE VIEW user_engagement_metrics AS
SELECT
    up.user_id,
    prof.programming_experience,
    prof.learning_style,
    COUNT(DISTINCT up.chapter_id) as unique_chapters_accessed,
    AVG(up.time_spent_seconds) as avg_time_per_chapter,
    COUNT(ub.id) as total_bookmarks,
    COUNT(un.id) as total_notes
FROM user_progress up
LEFT JOIN user_profiles prof ON up.user_id = prof.user_id
LEFT JOIN user_bookmarks ub ON up.user_id = ub.user_id
LEFT JOIN user_notes un ON up.user_id = un.user_id
GROUP BY up.user_id, prof.programming_experience, prof.learning_style;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE user_profiles IS 'Extended user profiles with background information for personalization';
COMMENT ON TABLE user_progress IS 'Tracks user progress through book chapters';
COMMENT ON TABLE user_bookmarks IS 'User-saved bookmarks for quick access';
COMMENT ON TABLE user_notes IS 'User notes on chapters and sections';
COMMENT ON TABLE user_achievements IS 'Gamification achievements earned by users';
