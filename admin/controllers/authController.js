const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

// Menampilkan halaman login
exports.showLoginForm = (req, res) => {
  res.render('auth/login', {
    title: 'Admin Login',
    layout: 'layouts/auth'
  });
};

// Proses login admin
exports.processLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validasi input
    if (!username || !password) {
      req.flash('error_msg', 'Username dan password diperlukan');
      return res.redirect('/auth/login');
    }
    
    // Cari user berdasarkan username
    const user = await User.findOne({
      where: { username }
    });
    
    // Jika user tidak ditemukan
    if (!user) {
      req.flash('error_msg', 'Username atau password salah');
      return res.redirect('/auth/login');
    }
    
    // Cek apakah pengguna adalah admin
    if (!user.isAdmin) {
      req.flash('error_msg', 'Anda tidak memiliki akses sebagai admin');
      return res.redirect('/auth/login');
    }
    
    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      req.flash('error_msg', 'Username atau password salah');
      return res.redirect('/auth/login');
    }
    
    // Buat token JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Simpan token di cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 jam
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Redirect ke dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat login');
    res.redirect('/auth/login');
  }
};

// Proses logout
exports.logout = (req, res) => {
  // Hapus token dari cookie
  res.clearCookie('adminToken');
  
  req.flash('success_msg', 'Anda telah berhasil logout');
  res.redirect('/auth/login');
};

// Menampilkan halaman profile admin
exports.showProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Ambil data user terbaru
    const user = await User.findByPk(userId);
    
    if (!user) {
      req.flash('error_msg', 'User tidak ditemukan');
      return res.redirect('/dashboard');
    }
    
    res.render('auth/profile', {
      title: 'Profile Admin',
      user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat mengambil profile');
    res.redirect('/dashboard');
  }
};

// Update profile admin
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, telegramId } = req.body;
    
    // Ambil data user
    const user = await User.findByPk(userId);
    
    if (!user) {
      req.flash('error_msg', 'User tidak ditemukan');
      return res.redirect('/auth/profile');
    }
    
    // Update data user
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (telegramId) user.telegramId = telegramId;
    
    await user.save();
    
    req.flash('success_msg', 'Profile berhasil diperbarui');
    res.redirect('/auth/profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat memperbarui profile');
    res.redirect('/auth/profile');
  }
};

// Ubah password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validasi input
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.flash('error_msg', 'Semua field password diperlukan');
      return res.redirect('/auth/profile');
    }
    
    if (newPassword !== confirmPassword) {
      req.flash('error_msg', 'Password baru dan konfirmasi password tidak cocok');
      return res.redirect('/auth/profile');
    }
    
    if (newPassword.length < 6) {
      req.flash('error_msg', 'Password baru minimal 6 karakter');
      return res.redirect('/auth/profile');
    }
    
    // Ambil data user
    const user = await User.findByPk(userId);
    
    if (!user) {
      req.flash('error_msg', 'User tidak ditemukan');
      return res.redirect('/auth/profile');
    }
    
    // Verifikasi password saat ini
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      req.flash('error_msg', 'Password saat ini salah');
      return res.redirect('/auth/profile');
    }
    
    // Hash password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    req.flash('success_msg', 'Password berhasil diubah');
    res.redirect('/auth/profile');
  } catch (error) {
    console.error('Error changing password:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat mengubah password');
    res.redirect('/auth/profile');
  }
};