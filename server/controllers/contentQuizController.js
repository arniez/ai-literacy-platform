const { query: executeQuery } = require('../config/db-universal');

/**
 * @desc    Get quiz questions for a specific content item
 * @route   GET /api/content-quiz/:contentId
 * @access  Protected
 */
exports.getContentQuiz = async (req, res) => {
  try {
    const { contentId } = req.params;

    // Check if content has quiz questions
    const [questions] = await executeQuery(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, order_index
       FROM content_quiz_questions
       WHERE content_id = $1
       ORDER BY order_index`,
      [contentId]
    );

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No quiz found for this content'
      });
    }

    // Get user's quiz status
    const [status] = await executeQuery(
      `SELECT * FROM user_content_quiz_status
       WHERE user_id = $1 AND content_id = $2`,
      [req.user.id, contentId]
    );

    // Get user's previous answers
    const [userAnswers] = await executeQuery(
      `SELECT question_id, selected_answer, is_correct
       FROM user_content_quiz_answers
       WHERE user_id = $1 AND content_id = $2`,
      [req.user.id, contentId]
    );

    res.status(200).json({
      success: true,
      data: {
        questions: questions,
        status: status[0] || null,
        previousAnswers: userAnswers
      }
    });
  } catch (error) {
    console.error('Get content quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Submit quiz answers for content
 * @route   POST /api/content-quiz/:contentId/submit
 * @access  Protected
 */
exports.submitContentQuiz = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { answers } = req.body; // Array of {questionId, answer}

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers array is required'
      });
    }

    // Get all questions with correct answers
    const [questions] = await executeQuery(
      `SELECT id, correct_answer FROM content_quiz_questions
       WHERE content_id = $1`,
      [contentId]
    );

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check answers and store results
    let correctCount = 0;
    const results = [];

    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);

      if (!question) continue;

      const isCorrect = answer.answer.toUpperCase() === question.correct_answer.toUpperCase();
      if (isCorrect) correctCount++;

      // Store user answer (PostgreSQL upsert)
      await executeQuery(
        `INSERT INTO user_content_quiz_answers
         (user_id, content_id, question_id, selected_answer, is_correct)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, question_id)
         DO UPDATE SET selected_answer = $4, is_correct = $5, answered_at = CURRENT_TIMESTAMP`,
        [req.user.id, contentId, answer.questionId, answer.answer, isCorrect]
      );

      results.push({
        questionId: answer.questionId,
        isCorrect
      });
    }

    const allCorrect = correctCount === questions.length;

    // Update or create quiz status (PostgreSQL upsert)
    await executeQuery(
      `INSERT INTO user_content_quiz_status
       (user_id, content_id, questions_answered, questions_correct, total_questions, passed, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, ${allCorrect ? 'CURRENT_TIMESTAMP' : 'NULL'})
       ON CONFLICT (user_id, content_id)
       DO UPDATE SET
       questions_answered = $3,
       questions_correct = $4,
       passed = $6,
       completed_at = ${allCorrect ? 'CURRENT_TIMESTAMP' : 'user_content_quiz_status.completed_at'}`,
      [req.user.id, contentId, answers.length, correctCount, questions.length, allCorrect]
    );

    // If all correct, update content progress to completed
    if (allCorrect) {
      await executeQuery(
        `UPDATE user_progress
         SET status = 'completed', completed_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND content_id = $2`,
        [req.user.id, contentId]
      );

      // Check if all basis content is completed for AI-literate badge
      await checkAILiterateBadge(req.user.id);
    }

    res.status(200).json({
      success: true,
      data: {
        results,
        score: correctCount,
        total: questions.length,
        passed: allCorrect,
        message: allCorrect
          ? 'Quiz voltooid! Content is gemarkeerd als afgerond.'
          : 'Niet alle antwoorden zijn correct. Probeer het opnieuw.'
      }
    });
  } catch (error) {
    console.error('Submit content quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get quiz questions for admin management
 * @route   GET /api/content-quiz/admin/:contentId
 * @access  Admin
 */
exports.getQuizQuestionsAdmin = async (req, res) => {
  try {
    const { contentId } = req.params;

    const [questions] = await executeQuery(
      `SELECT * FROM content_quiz_questions
       WHERE content_id = $1
       ORDER BY order_index`,
      [contentId]
    );

    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Get quiz questions admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Create or update quiz question
 * @route   POST /api/content-quiz/admin/:contentId
 * @access  Admin
 */
exports.createOrUpdateQuestion = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { id, questionText, correctAnswer, optionA, optionB, optionC, optionD, explanation, orderIndex } = req.body;

    if (!questionText || !correctAnswer || !optionA || !optionB || !optionC) {
      return res.status(400).json({
        success: false,
        message: 'Question text, correct answer, and options A, B, C are required'
      });
    }

    if (id) {
      // Update existing question
      await executeQuery(
        `UPDATE content_quiz_questions
         SET question_text = $1, correct_answer = $2, option_a = $3, option_b = $4, option_c = $5,
             option_d = $6, explanation = $7, order_index = $8, updated_at = CURRENT_TIMESTAMP
         WHERE id = $9 AND content_id = $10`,
        [questionText, correctAnswer, optionA, optionB, optionC, optionD || null, explanation || null, orderIndex || 0, id, contentId]
      );

      res.status(200).json({
        success: true,
        message: 'Question updated successfully'
      });
    } else {
      // Create new question
      const [result] = await executeQuery(
        `INSERT INTO content_quiz_questions
         (content_id, question_text, correct_answer, option_a, option_b, option_c, option_d, explanation, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [contentId, questionText, correctAnswer, optionA, optionB, optionC, optionD || null, explanation || null, orderIndex || 0]
      );

      res.status(201).json({
        success: true,
        message: 'Question created successfully',
        data: { id: result.rows ? result.rows[0].id : result[0].id }
      });
    }
  } catch (error) {
    console.error('Create/update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Delete quiz question
 * @route   DELETE /api/content-quiz/admin/:contentId/:questionId
 * @access  Admin
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    await executeQuery(
      'DELETE FROM content_quiz_questions WHERE id = $1',
      [questionId]
    );

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Helper function to check and award AI-literate badge
 */
async function checkAILiterateBadge(userId) {
  try {
    // Get all basis content IDs
    const [basisContent] = await executeQuery(
      `SELECT id FROM content WHERE tags::text LIKE '%basis%'`
    );

    const basisContentIds = basisContent.map(c => c.id);

    if (basisContentIds.length === 0) return;

    // Check if all basis content has completed quiz
    const placeholders = basisContentIds.map((_, i) => `$${i + 2}`).join(',');
    const [completedQuizzes] = await executeQuery(
      `SELECT COUNT(*) as completed
       FROM user_content_quiz_status
       WHERE user_id = $1 AND content_id IN (${placeholders}) AND passed = true`,
      [userId, ...basisContentIds]
    );

    // If all basis content quizzes are passed, award badge
    if (parseInt(completedQuizzes[0].completed) === basisContentIds.length) {
      // Find or create AI-literate badge
      const [badge] = await executeQuery(
        `SELECT id FROM badges WHERE name = 'AI-literate' OR name LIKE '%AI-literate%' LIMIT 1`
      );

      if (badge.length > 0) {
        // Check if user already has the badge
        const [userBadge] = await executeQuery(
          'SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2',
          [userId, badge[0].id]
        );

        // Award badge if not already awarded
        if (userBadge.length === 0) {
          await executeQuery(
            'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)',
            [userId, badge[0].id]
          );

          console.log(`✅ AI-literate badge awarded to user ${userId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking AI-literate badge:', error);
  }
}

// Functions already exported via exports.functionName above
