const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAdmin } = require('../middlewares/auth');

// Login routes
router.get('/login', authController.showLoginForm);
router.post('/login', authController.processLogin);

// Logout route (protected)
router.get('/logout', isAdmin, authController.logout);

// Password reset
router.get('/forgot-password', authController.showForgotPasswordForm || function(req, res) { res.send('Page under construction'); });
router.post('/forgot-password', authController.processForgotPassword || function(req, res) { res.send('Feature under construction'); });
router.get('/reset-password/:token', authController.showResetPasswordForm || function(req, res) { res.send('Page under construction'); });
router.post('/reset-password/:token', authController.processResetPassword || function(req, res) { res.send('Feature under construction'); });

// Profile routes (protected)
router.get('/profile', isAdmin, authController.showProfile);
router.post('/profile/update', isAdmin, authController.updateProfile);
router.post('/profile/change-password', isAdmin, authController.changePassword);

module.exports = router;