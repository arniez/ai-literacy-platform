const { query: executeQuery, insertAndGetId } = require('../config/db-universal');

// @desc    Get quiz for a module
// @route   GET /api/quiz/module/:moduleId
// @access  Private
exports.getQuizByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    // Get quiz
    const [quizzes] = await executeQuery(
      'SELECT * FROM quizzes WHERE module_id = ? AND is_active = true LIMIT 1',
      [moduleId]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No quiz found for this module'
      });
    }

    const quiz = quizzes[0];

    // Get questions with options
    const [questions] = await executeQuery(
      'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC',
      [quiz.id]
    );

    for (let question of questions) {
      const [options] = await executeQuery(
        'SELECT id, option_text, order_index FROM quiz_question_options WHERE question_id = ? ORDER BY order_index ASC',
        [question.id]
      );
      question.options = options;
    }

    // Check if user has completed the quiz
    const [attempts] = await executeQuery(
      'SELECT * FROM user_quiz_attempts WHERE user_id = ? AND quiz_id = ? AND passed = true LIMIT 1',
      [req.user.id, quiz.id]
    );

    const hasCompleted = attempts.length > 0;

    // Check if module content is completed
    const [moduleContent] = await executeQuery(
      'SELECT COUNT(*) as total FROM content WHERE module_id = ? AND is_published = true',
      [moduleId]
    );

    const [completedContent] = await executeQuery(
      `SELECT COUNT(*) as completed
       FROM user_progress up
       JOIN content c ON up.content_id = c.id
       WHERE up.user_id = ? AND c.module_id = ? AND up.status = 'completed'`,
      [req.user.id, moduleId]
    );

    const isUnlocked = completedContent[0].completed >= moduleContent[0].total;

    res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          passing_score: quiz.passing_score,
          time_limit: quiz.time_limit,
          total_questions: questions.length
        },
        questions: questions,
        isUnlocked: isUnlocked,
        hasCompleted: hasCompleted,
        requiredCompletion: {
          completed: parseInt(completedContent[0].completed),
          total: parseInt(moduleContent[0].total)
        }
      }
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Submit quiz answers
// @route   POST /api/quiz/:quizId/submit
// @access  Private
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, timeSpent } = req.body; // answers: [{ questionId, optionId }]

    // Get quiz info
    const [quizzes] = await executeQuery(
      'SELECT * FROM quizzes WHERE id = ?',
      [quizId]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const quiz = quizzes[0];

    // Calculate score
    let correctAnswers = 0;
    let totalQuestions = answers.length;

    // Create attempt record
    const attemptId = await insertAndGetId(
      `INSERT INTO user_quiz_attempts (user_id, quiz_id, score, max_score, percentage, passed, time_spent)
       VALUES (?, ?, 0, ?, 0, false, ?)`,
      [req.user.id, quizId, totalQuestions, timeSpent || 0]
    );

    // Check each answer
    for (const answer of answers) {
      const [options] = await executeQuery(
        'SELECT is_correct FROM quiz_question_options WHERE id = ?',
        [answer.optionId]
      );

      const isCorrect = options.length > 0 && options[0].is_correct;
      if (isCorrect) correctAnswers++;

      // Save user answer
      await executeQuery(
        'INSERT INTO user_quiz_answers (attempt_id, question_id, selected_option_id, is_correct) VALUES (?, ?, ?, ?)',
        [attemptId, answer.questionId, answer.optionId, isCorrect]
      );
    }

    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = percentage >= quiz.passing_score;

    // Update attempt with final score
    await executeQuery(
      'UPDATE user_quiz_attempts SET score = ?, percentage = ?, passed = ? WHERE id = ?',
      [correctAnswers, percentage, passed, attemptId]
    );

    // If passed, award badge
    if (passed) {
      // Check if badge exists for this module
      const [badges] = await executeQuery(
        `SELECT id FROM badges WHERE name LIKE ? LIMIT 1`,
        [`%${quiz.title.split(' ')[0]}%`] // Find badge matching module name
      );

      if (badges.length > 0) {
        // Check if user already has this badge
        const [userBadges] = await executeQuery(
          'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
          [req.user.id, badges[0].id]
        );

        if (userBadges.length === 0) {
          await executeQuery(
            'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
            [req.user.id, badges[0].id]
          );
        }
      }

      // Award points (e.g., 50 points for passing)
      await executeQuery(
        'UPDATE users SET total_points = total_points + 50 WHERE id = ?',
        [req.user.id]
      );
    }

    res.status(200).json({
      success: true,
      data: {
        attemptId,
        score: correctAnswers,
        maxScore: totalQuestions,
        percentage,
        passed,
        passingScore: quiz.passing_score,
        pointsAwarded: passed ? 50 : 0
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's quiz attempts
// @route   GET /api/quiz/:quizId/attempts
// @access  Private
exports.getUserAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;

    const [attempts] = await executeQuery(
      `SELECT * FROM user_quiz_attempts
       WHERE user_id = ? AND quiz_id = ?
       ORDER BY completed_at DESC`,
      [req.user.id, quizId]
    );

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts
    });
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
