const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const controller = require('../controllers/aiStudentIntegrationController');

const router = express.Router();
router.get('/', protect, authorize('admin'), controller.listLessons);
router.post('/import', protect, authorize('admin'), controller.importCatalog);
router.patch('/:id/publication', protect, authorize('admin'), controller.setPublication);

module.exports = router;
