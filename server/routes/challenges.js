const express = require('express');
const {
  getChallenges,
  getUserChallenges,
  acceptChallenge
} = require('../controllers/challengeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getChallenges);
router.get('/my', protect, getUserChallenges);
router.post('/:id/accept', protect, acceptChallenge);

module.exports = router;
