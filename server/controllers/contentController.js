const { pool } = require('../config/db');

// @desc    Get all content with filters
// @route   GET /api/content
// @access  Public
exports.getContent = async (req, res) => {
  try {
    const {
      type,
      difficulty,
      moduleId,
      search,
      featured,
      tag,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT c.*, m.title as module_title,
             (SELECT COUNT(*) FROM user_progress WHERE content_id = c.id AND status = 'completed') as completions
      FROM content c
      LEFT JOIN modules m ON c.module_id = m.id
      WHERE c.is_published = true
    `;
    const params = [];

    if (type) {
      query += ' AND c.content_type = ?';
      params.push(type);
    }

    if (difficulty) {
      query += ' AND c.difficulty = ?';
      params.push(difficulty);
    }

    if (moduleId) {
      query += ' AND c.module_id = ?';
      params.push(moduleId);
    }

    if (tag) {
      query += ' AND JSON_CONTAINS(c.tags, ?)';
      params.push(JSON.stringify(tag));
    }

    if (featured === 'true') {
      query += ' AND c.is_featured = true';
    }

    if (search) {
      query += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY c.is_featured DESC, c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [content] = await pool.query(query, params);

    // Add user progress if authenticated
    if (req.user) {
      for (let item of content) {
        const [progress] = await pool.query(
          'SELECT status, progress_percentage, completed_at FROM user_progress WHERE user_id = ? AND content_id = ?',
          [req.user.id, item.id]
        );
        item.userProgress = progress[0] || null;
      }
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM content c WHERE c.is_published = true';
    const countParams = [];

    if (type) {
      countQuery += ' AND c.content_type = ?';
      countParams.push(type);
    }
    if (difficulty) {
      countQuery += ' AND c.difficulty = ?';
      countParams.push(difficulty);
    }
    if (moduleId) {
      countQuery += ' AND c.module_id = ?';
      countParams.push(moduleId);
    }
    if (tag) {
      countQuery += ' AND JSON_CONTAINS(c.tags, ?)';
      countParams.push(JSON.stringify(tag));
    }
    if (featured === 'true') {
      countQuery += ' AND c.is_featured = true';
    }
    if (search) {
      countQuery += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    res.status(200).json({
      success: true,
      count: content.length,
      total: countResult[0].total,
      data: content
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single content by ID
// @route   GET /api/content/:id
// @access  Public
exports.getContentById = async (req, res) => {
  try {
    const [content] = await pool.query(
      `SELECT c.*, m.title as module_title
       FROM content c
       LEFT JOIN modules m ON c.module_id = m.id
       WHERE c.id = ? AND c.is_published = true`,
      [req.params.id]
    );

    if (content.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Increment view count
    await pool.query(
      'UPDATE content SET view_count = view_count + 1 WHERE id = ?',
      [req.params.id]
    );

    // Get user progress if authenticated
    let userProgress = null;
    if (req.user) {
      const [progress] = await pool.query(
        'SELECT * FROM user_progress WHERE user_id = ? AND content_id = ?',
        [req.user.id, req.params.id]
      );
      userProgress = progress[0] || null;
    }

    res.status(200).json({
      success: true,
      data: {
        ...content[0],
        userProgress
      }
    });
  } catch (error) {
    console.error('Get content by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get content statistics
// @route   GET /api/content/stats
// @access  Public
exports.getContentStats = async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT
        content_type,
        COUNT(*) as count,
        AVG(rating_avg) as avg_rating
      FROM content
      WHERE is_published = true
      GROUP BY content_type
    `);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get content stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Rate content
// @route   POST /api/content/:id/rate
// @access  Private
exports.rateContent = async (req, res) => {
  try {
    const { rating, reviewText } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if content exists
    const [content] = await pool.query(
      'SELECT id FROM content WHERE id = ?',
      [req.params.id]
    );

    if (content.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Insert or update rating
    await pool.query(
      `INSERT INTO content_ratings (user_id, content_id, rating, review_text)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = ?, review_text = ?, updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, req.params.id, rating, reviewText || null, rating, reviewText || null]
    );

    // Update content average rating
    const [ratingStats] = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count
       FROM content_ratings
       WHERE content_id = ?`,
      [req.params.id]
    );

    await pool.query(
      'UPDATE content SET rating_avg = ?, rating_count = ? WHERE id = ?',
      [ratingStats[0].avg_rating, ratingStats[0].rating_count, req.params.id]
    );

    // Award points for rating
    await pool.query(
      'UPDATE users SET total_points = total_points + 5 WHERE id = ?',
      [req.user.id]
    );

    // Create activity
    await pool.query(
      `INSERT INTO user_activities (user_id, activity_type, activity_data, points_earned)
       VALUES (?, 'content_rated', ?, 5)`,
      [req.user.id, JSON.stringify({ contentId: req.params.id, rating })]
    );

    res.status(200).json({
      success: true,
      message: 'Content rated successfully',
      data: {
        avgRating: parseFloat(ratingStats[0].avg_rating).toFixed(2),
        ratingCount: ratingStats[0].rating_count
      }
    });
  } catch (error) {
    console.error('Rate content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
