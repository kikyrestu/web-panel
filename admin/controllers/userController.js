const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { User, Order } = require('../../models');

// Menampilkan semua pengguna
exports.getAllUsers = async (req, res) => {
  try {
    // Filter dan pagination
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    // Buat query dasar
    let where = {};
    
    // Tambahkan pencarian jika ada
    if (search) {
      where = {
        [Op.or]: [
          { username: { [Op.iLike]: `%${search}%` } },
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { telegramId: { [Op.eq]: isNaN(search) ? 0 : parseInt(search) } }
        ]
      };
    }
    
    // Mencari pengguna dengan filter
    const { count, rows: users } = await User.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    // Hitung total halaman
    const totalPages = Math.ceil(count / limit);
    
    res.render('users/index', {
      title: 'Manajemen Pengguna',
      users,
      currentPage: page,
      totalPages,
      totalUsers: count,
      search
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat mengambil data pengguna');
    res.redirect('/dashboard');
  }
};

// Menampilkan detail pengguna
exports.getUserDetail = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Ambil detail pengguna
    const user = await User.findByPk(userId);
    
    if (!user) {
      req.flash('error_msg', 'Pengguna tidak ditemukan');
      return res.redirect('/users');
    }
    
    // Ambil pesanan pengguna
    const orders = await Order.findAll({
      where: { userId: userId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    // Hitung statistik pengguna
    const totalOrders = await Order.count({
      where: { userId: userId }
    });
    
    const totalSpent = await Order.sum('amount', {
      where: {
        userId: userId,
        status: 'completed'
      }
    }) || 0;
    
    const activeOrders = await Order.count({
      where: {
        userId: userId,
        status: 'completed',
        endDate: {
          [Op.gte]: new Date()
        }
      }
    });
    
    res.render('users/detail', {
      title: 'Detail Pengguna',
      user,
      orders,
      stats: {
        totalOrders,
        totalSpent,
        activeOrders,
        memberSince: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching user detail:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat mengambil detail pengguna');
    res.redirect('/users');
  }
};

// Form untuk edit pengguna
exports.showEditUserForm = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Ambil detail pengguna
    const user = await User.findByPk(userId);
    
    if (!user) {
      req.flash('error_msg', 'Pengguna tidak ditemukan');
      return res.redirect('/users');
    }
    
    res.render('users/edit', {
      title: 'Edit Pengguna',
      user
    });
  } catch (error) {
    console.error('Error fetching user for edit:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat mengambil data pengguna untuk diedit');
    res.redirect('/users');
  }
};

// Update pengguna
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, balance, isAdmin } = req.body;
    
    // Ambil pengguna
    const user = await User.findByPk(userId);
    
    if (!user) {
      req.flash('error_msg', 'Pengguna tidak ditemukan');
      return res.redirect('/users');
    }
    
    // Update data pengguna
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (balance) user.balance = parseFloat(balance);
    if (isAdmin !== undefined) user.isAdmin = isAdmin === 'true';
    
    await user.save();
    
    req.flash('success_msg', 'Data pengguna berhasil diperbarui');
    res.redirect(`/users/${userId}`);
  } catch (error) {
    console.error('Error updating user:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat memperbarui data pengguna');
    res.redirect(`/users/${req.params.id}/edit`);
  }
};

// Reset password pengguna (API)
exports.resetUserPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;
    
    // Validasi input
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru harus memiliki minimal 6 karakter'
      });
    }
    
    // Ambil pengguna
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan'
      });
    }
    
    // Hash password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Password berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui password',
      error: error.message
    });
  }
};

// Hapus pengguna (API)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Cek apakah masih memiliki pesanan aktif
    const activeOrders = await Order.count({
      where: {
        userId: userId,
        status: 'completed',
        endDate: {
          [Op.gte]: new Date()
        }
      }
    });
    
    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus pengguna yang masih memiliki pesanan aktif'
      });
    }
    
    // Ambil pengguna
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan'
      });
    }
    
    // Hapus pengguna
    await user.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Pengguna berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus pengguna',
      error: error.message
    });
  }
};