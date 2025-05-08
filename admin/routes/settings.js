// Settings routes
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Halaman pengaturan web
router.get('/', settingsController.showSettings);

// API endpoints untuk Vue.js frontend
router.get('/api', settingsController.apiGetSettings);
router.get('/api/:key', settingsController.apiGetSetting);
router.post('/api/:key', settingsController.apiUpdateSetting);
router.post('/api', settingsController.apiCreateSetting);
router.delete('/api/:key', settingsController.apiDeleteSetting);

module.exports = router;
