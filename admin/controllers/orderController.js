const { Op } = require('sequelize');
const { Order, User, VpsPackage, WebHostingPackage, GameHostingPackage } = require('../../models');

// Menampilkan semua pesanan
exports.getAllOrders = async (req, res) => {
  try {
    // Filter berdasarkan status, jika ada
    const status = req.query.status;
    const orderType = req.query.type;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    // Buat query dasar
    let where = {};
    
    // Tambahkan filter jika ada
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (orderType && orderType !== 'all') {
      where.orderType = orderType;
    }
    
    // Mencari pesanan dengan filter
    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'telegramId']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    // Hitung total halaman
    const totalPages = Math.ceil(count / limit);
    
    res.render('orders/index', {
      title: 'Manajemen Pesanan',
      orders,
      currentPage: page,
      totalPages,
      totalOrders: count,
      status: status || 'all',
      orderType: orderType || 'all'
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat mengambil data pesanan');
    res.redirect('/dashboard');
  }
};

// Menampilkan detail pesanan
exports.getOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Ambil detail pesanan
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: 'user'
        }
      ]
    });
    
    if (!order) {
      req.flash('error_msg', 'Pesanan tidak ditemukan');
      return res.redirect('/orders');
    }
    
    // Ambil detail paket berdasarkan orderType
    let packageDetail = null;
    
    if (order.orderType === 'VPS') {
      packageDetail = await VpsPackage.findByPk(order.packageId);
    } else if (order.orderType === 'WebHosting') {
      packageDetail = await WebHostingPackage.findByPk(order.packageId);
    } else if (order.orderType === 'GameHosting') {
      packageDetail = await GameHostingPackage.findByPk(order.packageId);
    }
    
    res.render('orders/detail', {
      title: 'Detail Pesanan',
      order,
      packageDetail
    });
  } catch (error) {
    console.error('Error fetching order detail:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat mengambil detail pesanan');
    res.redirect('/orders');
  }
};

// Mengubah status pesanan
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, notes } = req.body;
    
    // Ambil pesanan
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }
    
    // Update status dan catatan
    order.status = status;
    
    if (notes) {
      order.notes = order.notes ? `${order.notes}\n\n${notes}` : notes;
    }
    
    // Jika status berubah menjadi completed, set startDate dan endDate
    if (status === 'completed' && order.status !== 'completed') {
      const startDate = new Date();
      let endDate = new Date();
      
      // Tambahkan periode berdasarkan billing cycle
      if (order.billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (order.billingCycle === 'quarterly') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (order.billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      order.startDate = startDate;
      order.endDate = endDate;
    }
    
    await order.save();
    
    return res.status(200).json({
      success: true,
      message: 'Status pesanan berhasil diperbarui',
      data: {
        id: order.id,
        status: order.status,
        notes: order.notes,
        startDate: order.startDate,
        endDate: order.endDate
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui status pesanan',
      error: error.message
    });
  }
};

// Tambahkan detail server ke pesanan
exports.updateServerDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const serverDetails = req.body.serverDetails;
    
    // Validasi input
    if (!serverDetails) {
      return res.status(400).json({
        success: false,
        message: 'Detail server diperlukan'
      });
    }
    
    // Ambil pesanan
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }
    
    // Update detail server
    order.serverDetails = serverDetails;
    
    // Jika server details diisi, dan status masih processing, ubah menjadi completed
    if (order.status === 'processing') {
      order.status = 'completed';
      
      // Set startDate dan endDate
      const startDate = new Date();
      let endDate = new Date();
      
      // Tambahkan periode berdasarkan billing cycle
      if (order.billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (order.billingCycle === 'quarterly') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (order.billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      order.startDate = startDate;
      order.endDate = endDate;
      
      // Tambahkan catatan
      const notes = 'Server telah diaktifkan pada ' + startDate.toLocaleString('id-ID');
      order.notes = order.notes ? `${order.notes}\n\n${notes}` : notes;
    }
    
    await order.save();
    
    return res.status(200).json({
      success: true,
      message: 'Detail server berhasil diperbarui',
      data: {
        id: order.id,
        status: order.status,
        serverDetails: order.serverDetails,
        startDate: order.startDate,
        endDate: order.endDate
      }
    });
  } catch (error) {
    console.error('Error updating server details:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui detail server',
      error: error.message
    });
  }
};

// Menghapus pesanan
exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Ambil pesanan
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }
    
    // Hapus pesanan
    await order.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Pesanan berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus pesanan',
      error: error.message
    });
  }
};