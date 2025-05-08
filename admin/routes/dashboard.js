const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAdmin } = require('../middlewares/auth');

// Apply isAdmin middleware to all dashboard routes
router.use(isAdmin);

// Dashboard homepage - menampilkan statistik dan overview
router.get('/', dashboardController.showDashboard);

// Analytics page - menampilkan grafik dan analisis data
router.get('/analytics', dashboardController.showAnalytics);

module.exports = router;