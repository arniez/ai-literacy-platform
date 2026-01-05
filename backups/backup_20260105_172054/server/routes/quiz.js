const express = require('express');
const {
  getQuizByModule,
  submitQuiz,
  getUserAttempts
} = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/module/:moduleId', protect, getQuizByModule);
router.post('/:quizId/submit', protect, submitQuiz);
router.get('/:quizId/attempts', protect, getUserAttempts);

module.exports = router;
