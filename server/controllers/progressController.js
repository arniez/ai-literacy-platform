const { pool } = require('../config/db');

// @desc    Get user progress
// @route   GET /api/progress
// @access  Private
exports.getUserProgress = async (req, res) => {
  try {
    const [progress] = await pool.query(
      `SELECT up.*, c.title, c.content_type, c.thumbnail_url, c.points_reward
       FROM user_progress up
       JOIN content c ON up.content_id = c.id
       WHERE up.user_id = ?
       ORDER BY up.last_accessed DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      count: progress.length,
      data: progress
    });
  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update content progress
// @route   POST /api/progress/:contentId
// @access  Private
exports.updateProgress = async (req, res) => {
  try {
    const { status, progressPercentage, timeSpent, notes } = req.body;
    const contentId = req.params.contentId;

    // Check if content exists
    const [content] = await pool.query(
      'SELECT id, points_reward FROM content WHERE id = ?',
      [contentId]
    );

    if (content.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Check existing progress
    const [existingProgress] = await pool.query(
      'SELECT * FROM user_progress WHERE user_id = ? AND content_id = ?',
      [req.user.id, contentId]
    );

    const wasCompleted = existingProgress.length > 0 && existingProgress[0].status === 'completed';
    const isNowCompleted = status === 'completed';

    if (existingProgress.length === 0) {
      // Insert new progress
      await pool.query(
        `INSERT INTO user_progress (user_id, content_id, status, progress_percentage, time_spent, notes, last_accessed, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
        [
          req.user.id,
          contentId,
          status || 'in_progress',
          progressPercentage || 0,
          timeSpent || 0,
          notes || null,
          isNowCompleted ? new Date() : null
        ]
      );
    } else {
      // Update existing progress
      await pool.query(
        `UPDATE user_progress SET
          status = ?,
          progress_percentage = ?,
          time_spent = time_spent + ?,
          notes = COALESCE(?, notes),
          last_accessed = CURRENT_TIMESTAMP,
          completed_at = ?
         WHERE user_id = ? AND content_id = ?`,
        [
          status || existingProgress[0].status,
          progressPercentage !== undefined ? progressPercentage : existingProgress[0].progress_percentage,
          timeSpent || 0,
          notes,
          isNowCompleted && !wasCompleted ? new Date() : existingProgress[0].completed_at,
          req.user.id,
          contentId
        ]
      );
    }

    // Award points if newly completed
    if (isNowCompleted && !wasCompleted) {
      const pointsAwarded = content[0].points_reward || 10;

      await pool.query(
        'UPDATE users SET total_points = total_points + ? WHERE id = ?',
        [pointsAwarded, req.user.id]
      );

      // Create activity
      await pool.query(
        `INSERT INTO user_activities (user_id, activity_type, activity_data, points_earned)
         VALUES (?, 'content_completed', ?, ?)`,
        [req.user.id, JSON.stringify({ contentId }), pointsAwarded]
      );

      // Create notification
      await pool.query(
        `INSERT INTO notifications (user_id, notification_type, title, message)
         VALUES (?, 'achievement', 'Content Completed!', ?)`,
        [req.user.id, `You earned ${pointsAwarded} points!`]
      );

      // Check and update level
      await checkAndUpdateLevel(req.user.id);

      // Check badge achievements
      await checkBadgeAchievements(req.user.id);

      // Update challenge progress
      await updateChallengeProgress(req.user.id, 'content_complete');
    }

    res.status(200).json({
      success: true,
      message: isNowCompleted && !wasCompleted ? 'Progress updated and content completed!' : 'Progress updated',
      pointsAwarded: isNowCompleted && !wasCompleted ? (content[0].points_reward || 10) : 0
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user stats
// @route   GET /api/progress/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    // Get completion stats
    const [completionStats] = await pool.query(
      `SELECT
        COUNT(DISTINCT content_id) as total_completed,
        SUM(time_spent) as total_time_spent,
        COUNT(DISTINCT DATE(completed_at)) as study_days
       FROM user_progress
       WHERE user_id = ? AND status = 'completed'`,
      [req.user.id]
    );

    // Get content type breakdown
    const [contentTypeStats] = await pool.query(
      `SELECT c.content_type, COUNT(*) as count
       FROM user_progress up
       JOIN content c ON up.content_id = c.id
       WHERE up.user_id = ? AND up.status = 'completed'
       GROUP BY c.content_type`,
      [req.user.id]
    );

    // Get badges count
    const [badgeCount] = await pool.query(
      'SELECT COUNT(*) as badge_count FROM user_badges WHERE user_id = ?',
      [req.user.id]
    );

    // Get current streak
    const [streakData] = await pool.query(
      `SELECT DATE(last_accessed) as access_date
       FROM user_progress
       WHERE user_id = ?
       ORDER BY last_accessed DESC
       LIMIT 30`,
      [req.user.id]
    );

    const currentStreak = calculateStreak(streakData);

    // Get user rank
    const [rankData] = await pool.query(
      `SELECT COUNT(*) + 1 as \`rank\`
       FROM users
       WHERE total_points > (SELECT total_points FROM users WHERE id = ?)`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: {
        totalCompleted: completionStats[0].total_completed || 0,
        totalTimeSpent: completionStats[0].total_time_spent || 0,
        studyDays: completionStats[0].study_days || 0,
        contentTypeBreakdown: contentTypeStats,
        badgeCount: badgeCount[0].badge_count || 0,
        currentStreak: currentStreak,
        rank: rankData[0].rank
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function to calculate streak
function calculateStreak(streakData) {
  if (streakData.length === 0) return 0;

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastAccess = new Date(streakData[0].access_date);
  lastAccess.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today - lastAccess) / (1000 * 60 * 60 * 24));

  // If last access was more than 1 day ago, streak is broken
  if (daysDiff > 1) return 0;

  for (let i = 1; i < streakData.length; i++) {
    const currentDate = new Date(streakData[i - 1].access_date);
    const prevDate = new Date(streakData[i].access_date);

    const diff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Helper function to check and update user level
async function checkAndUpdateLevel(userId) {
  const [user] = await pool.query(
    'SELECT total_points, level FROM users WHERE id = ?',
    [userId]
  );

  if (user.length === 0) return;

  const points = user[0].total_points;
  const currentLevel = user[0].level;

  // Level calculation: Level = floor(points / 100) + 1
  const newLevel = Math.floor(points / 100) + 1;

  if (newLevel > currentLevel) {
    await pool.query(
      'UPDATE users SET level = ? WHERE id = ?',
      [newLevel, userId]
    );

    // Create level up activity
    await pool.query(
      `INSERT INTO user_activities (user_id, activity_type, activity_data, points_earned)
       VALUES (?, 'level_up', ?, 0)`,
      [userId, JSON.stringify({ newLevel })]
    );

    // Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, notification_type, title, message)
       VALUES (?, 'achievement', 'Level Up!', ?)`,
      [userId, `Congratulations! You reached level ${newLevel}`]
    );
  }
}

// Helper function to check badge achievements
async function checkBadgeAchievements(userId) {
  // Get all active badges with requirements
  const [badges] = await pool.query(
    'SELECT * FROM badges WHERE is_active = true'
  );

  for (const badge of badges) {
    // Check if user already has this badge
    const [existingBadge] = await pool.query(
      'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
      [userId, badge.id]
    );

    if (existingBadge.length > 0) continue;

    let earned = false;

    // Check requirement based on type
    switch (badge.requirement_type) {
      case 'points':
        const [userPoints] = await pool.query(
          'SELECT total_points FROM users WHERE id = ?',
          [userId]
        );
        if (userPoints[0].total_points >= badge.requirement_value) {
          earned = true;
        }
        break;

      case 'content_complete':
        const [completedCount] = await pool.query(
          'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = "completed"',
          [userId]
        );
        if (completedCount[0].count >= badge.requirement_value) {
          earned = true;
        }
        break;

      case 'streak_days':
        // Would need streak calculation here
        break;
    }

    if (earned) {
      // Award badge
      await pool.query(
        'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
        [userId, badge.id]
      );

      // Award points
      if (badge.points_reward > 0) {
        await pool.query(
          'UPDATE users SET total_points = total_points + ? WHERE id = ?',
          [badge.points_reward, userId]
        );
      }

      // Create activity
      await pool.query(
        `INSERT INTO user_activities (user_id, activity_type, activity_data, points_earned)
         VALUES (?, 'badge_earned', ?, ?)`,
        [userId, JSON.stringify({ badgeId: badge.id, badgeName: badge.name }), badge.points_reward]
      );

      // Create notification
      await pool.query(
        `INSERT INTO notifications (user_id, notification_type, title, message)
         VALUES (?, 'badge', 'New Badge Earned!', ?)`,
        [userId, `You earned the "${badge.name}" badge!`]
      );
    }
  }
}

// Helper function to update challenge progress
async function updateChallengeProgress(userId, actionType) {
  // Get active challenges for user
  const [userChallenges] = await pool.query(
    `SELECT uc.*, c.objective, c.target_value, c.points_reward, c.badge_reward_id
     FROM user_challenges uc
     JOIN challenges c ON uc.challenge_id = c.id
     WHERE uc.user_id = ? AND uc.status = 'active' AND c.is_active = true
       AND (c.end_date IS NULL OR c.end_date > CURRENT_TIMESTAMP)`,
    [userId]
  );

  for (const userChallenge of userChallenges) {
    // Update progress based on action type matching objective
    if (userChallenge.objective.includes(actionType)) {
      const newProgress = userChallenge.current_progress + 1;
      const completed = newProgress >= userChallenge.target_value;

      await pool.query(
        `UPDATE user_challenges SET
          current_progress = ?,
          status = ?,
          completed_at = ?
         WHERE id = ?`,
        [
          newProgress,
          completed ? 'completed' : 'active',
          completed ? new Date() : null,
          userChallenge.id
        ]
      );

      if (completed) {
        // Award points
        if (userChallenge.points_reward > 0) {
          await pool.query(
            'UPDATE users SET total_points = total_points + ? WHERE id = ?',
            [userChallenge.points_reward, userId]
          );
        }

        // Award badge if applicable
        if (userChallenge.badge_reward_id) {
          await pool.query(
            'INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)',
            [userId, userChallenge.badge_reward_id]
          );
        }

        // Create activity
        await pool.query(
          `INSERT INTO user_activities (user_id, activity_type, activity_data, points_earned)
           VALUES (?, 'challenge_completed', ?, ?)`,
          [userId, JSON.stringify({ challengeId: userChallenge.challenge_id }), userChallenge.points_reward]
        );

        // Create notification
        await pool.query(
          `INSERT INTO notifications (user_id, notification_type, title, message)
           VALUES (?, 'challenge', 'Challenge Completed!', ?)`,
          [userId, `You completed a challenge and earned ${userChallenge.points_reward} points!`]
        );
      }
    }
  }
}

// Module exports are already defined using exports. syntax above
