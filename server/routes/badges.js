const express = require('express');
const {
  getAllBadges,
  getUserBadges,
  getBadgeProgress
} = require('../controllers/badgeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllBadges);
router.get('/user/:userId', getUserBadges);
router.get('/progress', protect, getBadgeProgress);

module.exports = router;
