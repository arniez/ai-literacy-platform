const express = require('express');
const {
  getLeaderboard,
  getUserProfile,
  toggleFollow,
  getComments,
  postComment,
  toggleCommentLike,
  getActivityFeed,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/socialController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/profile/:userId', getUserProfile);
router.post('/follow/:userId', protect, toggleFollow);
router.get('/comments/:contentId', getComments);
router.post('/comments/:contentId', protect, postComment);
router.post('/comments/:commentId/like', protect, toggleCommentLike);
router.get('/feed', protect, getActivityFeed);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);
router.put('/notifications/read-all', protect, markAllNotificationsRead);

module.exports = router;
