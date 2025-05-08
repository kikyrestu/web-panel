const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAdmin } = require('../middlewares/auth');

// Apply isAdmin middleware to all order routes
router.use(isAdmin);

// List all orders
router.get('/', orderController.listOrders);

// View specific order
router.get('/:id', orderController.viewOrder);

// Update order status
router.post('/:id/status', orderController.updateOrderStatus);

// Delete order
router.delete('/:id', orderController.deleteOrder);

// Filter orders
router.get('/filter/:status', orderController.filterOrdersByStatus);

// Search orders
router.post('/search', orderController.searchOrders);

module.exports = router;