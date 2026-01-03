const { pool } = require('../config/db');

// @desc    Get all badges
// @route   GET /api/badges
// @access  Public
exports.getAllBadges = async (req, res) => {
  try {
    const [badges] = await pool.query(
      'SELECT * FROM badges WHERE is_active = true ORDER BY rarity DESC, name ASC'
    );

    res.status(200).json({
      success: true,
      count: badges.length,
      data: badges
    });
  } catch (error) {
    console.error('Get all badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's badges
// @route   GET /api/badges/user/:userId
// @access  Public
exports.getUserBadges = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;

    const [userBadges] = await pool.query(
      `SELECT ub.*, b.name, b.description, b.icon, b.badge_type, b.rarity, b.points_reward
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      count: userBadges.length,
      data: userBadges
    });
  } catch (error) {
    console.error('Get user badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get badge progress for user
// @route   GET /api/badges/progress
// @access  Private
exports.getBadgeProgress = async (req, res) => {
  try {
    // Get all badges with user's progress towards earning them
    const [badges] = await pool.query(
      `SELECT b.*,
              ub.id as user_badge_id,
              ub.earned_at,
              CASE
                WHEN b.requirement_type = 'points' THEN
                  (SELECT total_points FROM users WHERE id = ?)
                WHEN b.requirement_type = 'content_complete' THEN
                  (SELECT COUNT(*) FROM user_progress WHERE user_id = ? AND status = 'completed')
                ELSE 0
              END as current_progress
       FROM badges b
       LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
       WHERE b.is_active = true
       ORDER BY ub.earned_at IS NULL DESC, b.rarity DESC`,
      [req.user.id, req.user.id, req.user.id]
    );

    const badgesWithProgress = badges.map(badge => ({
      ...badge,
      earned: badge.user_badge_id !== null,
      progressPercentage: badge.user_badge_id
        ? 100
        : Math.min(100, Math.round((badge.current_progress / badge.requirement_value) * 100))
    }));

    res.status(200).json({
      success: true,
      data: badgesWithProgress
    });
  } catch (error) {
    console.error('Get badge progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
