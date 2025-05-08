const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAdmin } = require('../middlewares/auth');

// Login routes
router.get('/login', authController.loginPage);
router.post('/login', authController.login);

// Logout route (protected)
router.get('/logout', isAdmin, authController.logout);

// Password reset
router.get('/forgot-password', authController.forgotPasswordPage);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.resetPasswordPage);
router.post('/reset-password/:token', authController.resetPassword);

// Profile routes (protected)
router.get('/profile', isAdmin, authController.profilePage);
router.post('/profile/update', isAdmin, authController.updateProfile);

module.exports = router;