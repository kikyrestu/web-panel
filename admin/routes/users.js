const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { checkAuth } = require('../middlewares/auth');

// Route untuk halaman daftar pengguna
router.get('/', checkAuth, userController.getAllUsers);

// Route untuk detail pengguna
router.get('/:id', checkAuth, userController.getUserDetail);

// Route untuk form edit pengguna
router.get('/:id/edit', checkAuth, userController.showEditUserForm);

// Route untuk update data pengguna
router.post('/:id/update', checkAuth, userController.updateUser);

// Route untuk reset password pengguna (API)
router.put('/:id/reset-password', checkAuth, userController.resetUserPassword);

// Route untuk hapus pengguna (API)
router.delete('/:id', checkAuth, userController.deleteUser);

module.exports = router;