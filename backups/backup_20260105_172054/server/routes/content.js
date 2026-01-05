const express = require('express');
const {
  getContent,
  getContentById,
  getContentStats,
  rateContent,
  createContent,
  updateContent,
  deleteContent,
  getModules
} = require('../controllers/contentController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

const router = express.Router();

// Public/optional auth routes
router.get('/', optionalAuth, getContent);
router.get('/stats', getContentStats);
router.get('/modules', getModules);

// Protected routes
router.get('/:id', protect, getContentById);
router.post('/:id/rate', protect, rateContent);

// Admin only routes
router.post('/', protect, authorize('admin'), createContent);
router.put('/:id', protect, authorize('admin'), updateContent);
router.delete('/:id', protect, authorize('admin'), deleteContent);

module.exports = router;
