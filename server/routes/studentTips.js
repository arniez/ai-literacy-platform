const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const controller = require('../controllers/studentTipController');

const router = express.Router();
router.use(protect);

router.post('/', controller.create);
router.get('/mine', controller.getMine);
router.get('/review', authorize('teacher', 'admin'), controller.getReviewQueue);
router.patch('/:id/review', authorize('teacher', 'admin'), controller.review);
router.get('/', controller.getPublished);

module.exports = router;
