const bcrypt = require('bcryptjs');
const { query, insertAndGetId } = require('../config/db-universal');
const generateToken = require('../utils/generateToken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, studyProgram } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password'
      });
    }

    // Check if user exists
    const [existingUsers] = await query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with that email or username'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userId = await insertAndGetId(
      `INSERT INTO users (username, email, password, first_name, last_name, study_program)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, firstName || null, lastName || null, studyProgram || null]
    );

    // Create welcome notification (optional - don't fail if table doesn't exist)
    try {
      await insertAndGetId(
        `INSERT INTO notifications (user_id, notification_type, title, message, link_url)
         VALUES (?, 'system', 'Welcome to AI Literacy!', 'Start your journey by exploring learning materials', '/leermaterialen')`,
        [userId]
      );
    } catch (error) {
      console.log('Could not create welcome notification:', error.message);
    }

    // Award "AI Pioneer" welcome badge (optional - don't fail if table doesn't exist)
    try {
      const [welcomeBadge] = await query(
        'SELECT id FROM badges WHERE name = ? LIMIT 1',
        ['AI Pioneer']
      );

      if (welcomeBadge.length > 0) {
        await insertAndGetId(
          'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
          [userId, welcomeBadge[0].id]
        );
      }
    } catch (error) {
      console.log('Could not award welcome badge:', error.message);
    }

    const token = generateToken(userId);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        username,
        email,
        firstName,
        lastName,
        role: 'student',
        totalPoints: 0,
        level: 1
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const [users] = await query(
      `SELECT id, username, email, password, first_name, last_name, role,
              avatar_url, total_points, level, is_active
       FROM users WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        totalPoints: user.total_points,
        level: user.level
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const [users] = await query(
      `SELECT id, username, email, first_name, last_name, role, study_program,
              avatar_url, bio, total_points, level, created_at, last_login
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, studyProgram, avatarUrl } = req.body;

    await query(
      `UPDATE users SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        bio = COALESCE(?, bio),
        study_program = COALESCE(?, study_program),
        avatar_url = COALESCE(?, avatar_url)
       WHERE id = ?`,
      [firstName, lastName, bio, studyProgram, avatarUrl, req.user.id]
    );

    const [users] = await query(
      `SELECT id, username, email, first_name, last_name, role, study_program,
              avatar_url, bio, total_points, level
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
