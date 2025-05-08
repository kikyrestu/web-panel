const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { checkAuth, checkGuest } = require('../middlewares/auth');

// Login routes
router.get('/login', authController.showLoginForm);
router.post('/login', authController.processLogin);

// Logout route (protected)
router.get('/logout', checkAuth, authController.logout);

// Profile routes (protected)
router.get('/profile', checkAuth, authController.showProfile);
router.post('/profile/update', checkAuth, authController.updateProfile);
router.post('/profile/change-password', checkAuth, authController.changePassword);

// Password reset - menggunakan arrow function yang valid
router.get('/forgot-password', (req, res) => {
  res.send('Forgot password page under construction');
});

router.post('/forgot-password', (req, res) => {
  res.send('Forgot password feature under construction');
});

router.get('/reset-password/:token', (req, res) => {
  res.send('Reset password page under construction');
});

router.post('/reset-password/:token', (req, res) => {
  res.send('Reset password feature under construction');
});

module.exports = router;