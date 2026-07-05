const express = require('express');
const router = express.Router();
const { addSite, getAllSites, updateSite, deleteSite } = require('../controllers/siteController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('admin'), getAllSites)
  .post(protect, authorize('admin'), addSite);

router.route('/:id')
  .put(protect, authorize('admin'), updateSite)
  .delete(protect, authorize('admin'), deleteSite);

module.exports = router;