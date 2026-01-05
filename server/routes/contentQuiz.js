const express = require('express');
const {
  getContentQuiz,
  submitContentQuiz,
  getQuizQuestionsAdmin,
  createOrUpdateQuestion,
  deleteQuestion
} = require('../controllers/contentQuizController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// User routes
router.get('/:contentId', protect, getContentQuiz);
router.post('/:contentId/submit', protect, submitContentQuiz);

// Admin routes
router.get('/admin/:contentId', protect, authorize('admin'), getQuizQuestionsAdmin);
router.post('/admin/:contentId', protect, authorize('admin'), createOrUpdateQuestion);
router.delete('/admin/:contentId/:questionId', protect, authorize('admin'), deleteQuestion);

module.exports = router;
