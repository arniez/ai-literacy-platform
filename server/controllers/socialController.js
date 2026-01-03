const { pool } = require('../config/db');

// @desc    Get leaderboard
// @route   GET /api/social/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const [users] = await pool.query(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.avatar_url,
              u.total_points, u.level, u.study_program,
              CONCAT(u.first_name, ' ', u.last_name) as name,
              (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badge_count,
              (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND status = 'completed') as completed_count
       FROM users u
       WHERE u.is_active = true
       ORDER BY u.total_points DESC, u.level DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user profile
// @route   GET /api/social/profile/:userId
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.avatar_url,
              u.bio, u.total_points, u.level, u.study_program, u.created_at,
              (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badge_count,
              (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND status = 'completed') as completed_count,
              (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.id) as following_count,
              (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count
       FROM users u
       WHERE u.id = ? AND u.is_active = true`,
      [req.params.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get recent activities
    const [activities] = await pool.query(
      `SELECT * FROM user_activities
       WHERE user_id = ? AND is_public = true
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.params.userId]
    );

    // Get recent badges
    const [badges] = await pool.query(
      `SELECT ub.earned_at, b.name, b.icon, b.rarity
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ? AND ub.is_displayed = true
       ORDER BY ub.earned_at DESC
       LIMIT 6`,
      [req.params.userId]
    );

    // Check if current user follows this user
    let isFollowing = false;
    if (req.user) {
      const [followCheck] = await pool.query(
        'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?',
        [req.user.id, req.params.userId]
      );
      isFollowing = followCheck.length > 0;
    }

    res.status(200).json({
      success: true,
      data: {
        ...users[0],
        activities,
        badges,
        isFollowing
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/social/follow/:userId
// @access  Private
exports.toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (targetUserId == req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Check if already following
    const [existing] = await pool.query(
      'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, targetUserId]
    );

    if (existing.length > 0) {
      // Unfollow
      await pool.query(
        'DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?',
        [req.user.id, targetUserId]
      );

      res.status(200).json({
        success: true,
        message: 'Unfollowed successfully',
        isFollowing: false
      });
    } else {
      // Follow
      await pool.query(
        'INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)',
        [req.user.id, targetUserId]
      );

      // Create notification
      await pool.query(
        `INSERT INTO notifications (user_id, notification_type, title, message, link_url)
         VALUES (?, 'follow', 'New Follower', ?, ?)`,
        [targetUserId, `${req.user.username} started following you`, `/profile/${req.user.id}`]
      );

      res.status(200).json({
        success: true,
        message: 'Followed successfully',
        isFollowing: true
      });
    }
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get content comments
// @route   GET /api/social/comments/:contentId
// @access  Public
exports.getComments = async (req, res) => {
  try {
    const [comments] = await pool.query(
      `SELECT c.*, u.username, u.first_name, u.last_name, u.avatar_url, u.level,
              (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as actual_likes_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.content_id = ? AND c.parent_comment_id IS NULL
       ORDER BY c.created_at DESC`,
      [req.params.contentId]
    );

    // Get replies for each comment
    for (let comment of comments) {
      const [replies] = await pool.query(
        `SELECT c.*, u.username, u.first_name, u.last_name, u.avatar_url, u.level
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.parent_comment_id = ?
         ORDER BY c.created_at ASC`,
        [comment.id]
      );
      comment.replies = replies;
    }

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Post comment
// @route   POST /api/social/comments/:contentId
// @access  Private
exports.postComment = async (req, res) => {
  try {
    const { commentText, parentCommentId } = req.body;

    if (!commentText || commentText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO comments (user_id, content_id, parent_comment_id, comment_text) VALUES (?, ?, ?, ?)',
      [req.user.id, req.params.contentId, parentCommentId || null, commentText.trim()]
    );

    // Award points for commenting
    await pool.query(
      'UPDATE users SET total_points = total_points + 3 WHERE id = ?',
      [req.user.id]
    );

    // Create activity
    await pool.query(
      `INSERT INTO user_activities (user_id, activity_type, activity_data, points_earned)
       VALUES (?, 'comment_posted', ?, 3)`,
      [req.user.id, JSON.stringify({ contentId: req.params.contentId, commentId: result.insertId })]
    );

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      commentId: result.insertId
    });
  } catch (error) {
    console.error('Post comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Like/Unlike comment
// @route   POST /api/social/comments/:commentId/like
// @access  Private
exports.toggleCommentLike = async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?',
      [req.user.id, req.params.commentId]
    );

    if (existing.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?',
        [req.user.id, req.params.commentId]
      );

      await pool.query(
        'UPDATE comments SET likes_count = likes_count - 1 WHERE id = ?',
        [req.params.commentId]
      );

      res.status(200).json({
        success: true,
        message: 'Comment unliked',
        liked: false
      });
    } else {
      // Like
      await pool.query(
        'INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)',
        [req.user.id, req.params.commentId]
      );

      await pool.query(
        'UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?',
        [req.params.commentId]
      );

      res.status(200).json({
        success: true,
        message: 'Comment liked',
        liked: true
      });
    }
  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user activities feed
// @route   GET /api/social/feed
// @access  Private
exports.getActivityFeed = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    // Get activities from followed users and self
    const [activities] = await pool.query(
      `SELECT ua.*, u.username, u.first_name, u.last_name, u.avatar_url, u.level
       FROM user_activities ua
       JOIN users u ON ua.user_id = u.id
       WHERE ua.is_public = true
         AND (ua.user_id = ? OR ua.user_id IN (
           SELECT following_id FROM user_follows WHERE follower_id = ?
         ))
       ORDER BY ua.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, req.user.id, parseInt(limit), parseInt(offset)]
    );

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get notifications
// @route   GET /api/social/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;

    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];

    if (unreadOnly === 'true') {
      query += ' AND is_read = false';
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [notifications] = await pool.query(query, params);

    // Get unread count
    const [unreadCount] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false',
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount: unreadCount[0].count,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/social/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/social/notifications/read-all
// @access  Private
exports.markAllNotificationsRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false',
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
