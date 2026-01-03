const { query, insertAndGetId } = require('../config/db-universal');

// @desc    Get all active challenges
// @route   GET /api/challenges
// @access  Public
exports.getChallenges = async (req, res) => {
  try {
    const [challenges] = await query(
      `SELECT c.*, b.name as badge_name, b.icon as badge_icon
       FROM challenges c
       LEFT JOIN badges b ON c.badge_reward_id = b.id
       WHERE c.is_active = true
         AND (c.end_date IS NULL OR c.end_date > CURRENT_TIMESTAMP)
       ORDER BY c.challenge_type, c.created_at DESC`
    );

    res.status(200).json({
      success: true,
      count: challenges.length,
      data: challenges
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's active challenges
// @route   GET /api/challenges/my
// @access  Private
exports.getUserChallenges = async (req, res) => {
  try {
    const [userChallenges] = await query(
      `SELECT uc.*, c.title, c.description, c.challenge_type, c.objective,
              c.target_value, c.points_reward, c.end_date,
              b.name as badge_reward_name, b.icon as badge_reward_icon
       FROM user_challenges uc
       JOIN challenges c ON uc.challenge_id = c.id
       LEFT JOIN badges b ON c.badge_reward_id = b.id
       WHERE uc.user_id = ?
       ORDER BY uc.status ASC, uc.started_at DESC`,
      [req.user.id]
    );

    const challengesWithProgress = userChallenges.map(challenge => ({
      ...challenge,
      progressPercentage: Math.round((challenge.current_progress / challenge.target_value) * 100)
    }));

    res.status(200).json({
      success: true,
      count: challengesWithProgress.length,
      data: challengesWithProgress
    });
  } catch (error) {
    console.error('Get user challenges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Accept a challenge
// @route   POST /api/challenges/:id/accept
// @access  Private
exports.acceptChallenge = async (req, res) => {
  try {
    // Check if challenge exists and is active
    const [challenges] = await query(
      `SELECT * FROM challenges
       WHERE id = ? AND is_active = true
         AND (end_date IS NULL OR end_date > CURRENT_TIMESTAMP)`,
      [req.params.id]
    );

    if (challenges.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found or inactive'
      });
    }

    // Check if user already accepted this challenge
    const [existing] = await query(
      'SELECT id FROM user_challenges WHERE user_id = ? AND challenge_id = ?',
      [req.user.id, req.params.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already accepted this challenge'
      });
    }

    // Accept challenge
    await query(
      'INSERT INTO user_challenges (user_id, challenge_id, status) VALUES (?, ?, ?)',
      [req.user.id, req.params.id, 'active']
    );

    res.status(200).json({
      success: true,
      message: 'Challenge accepted successfully'
    });
  } catch (error) {
    console.error('Accept challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
