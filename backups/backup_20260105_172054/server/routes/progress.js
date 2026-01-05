const express = require('express');
const {
  getUserProgress,
  updateProgress,
  getUserStats
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getUserProgress);
router.get('/stats', protect, getUserStats);
router.post('/:contentId', protect, updateProgress);

module.exports = router;
