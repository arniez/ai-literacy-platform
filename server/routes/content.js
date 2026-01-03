const express = require('express');
const {
  getContent,
  getContentById,
  getContentStats,
  rateContent
} = require('../controllers/contentController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getContent);
router.get('/stats', getContentStats);
router.get('/:id', protect, getContentById);
router.post('/:id/rate', protect, rateContent);

module.exports = router;
