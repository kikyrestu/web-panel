const express = require('express');
const router = express.Router();
const vpsController = require('../controllers/vpsController');
const { checkAuth } = require('../middlewares/auth');

// Route untuk halaman daftar paket VPS
router.get('/', checkAuth, vpsController.getAllPackages);

// Route untuk halaman tambah paket VPS baru
router.get('/add', checkAuth, vpsController.showAddPackageForm);

// Route untuk proses tambah paket VPS baru
router.post('/add', checkAuth, vpsController.addPackage);

// Route untuk halaman edit paket VPS
router.get('/:id/edit', checkAuth, vpsController.showEditPackageForm);

// Route untuk proses update paket VPS
router.post('/:id/update', checkAuth, vpsController.updatePackage);

// Route untuk hapus paket VPS (API)
router.delete('/:id', checkAuth, vpsController.deletePackage);

module.exports = router;