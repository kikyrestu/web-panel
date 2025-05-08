const jwt = require('jsonwebtoken');
const { User } = require('../../models');

// Middleware untuk memverifikasi apakah pengguna sudah login sebagai admin
exports.checkAuth = async (req, res, next) => {
  try {
    // Cek apakah ada token di cookie
    const token = req.cookies.adminToken;
    
    if (!token) {
      // Jika tidak ada token, redirect ke halaman login
      return res.redirect('/auth/login');
    }
    
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Cari user berdasarkan id
    const user = await User.findByPk(decoded.userId);
    
    // Jika user tidak ditemukan atau bukan admin
    if (!user || !user.isAdmin) {
      res.clearCookie('adminToken');
      return res.redirect('/auth/login');
    }
    
    // Simpan data user di request untuk digunakan di controller
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.clearCookie('adminToken');
    return res.redirect('/auth/login');
  }
};

// Middleware untuk halaman login (jika sudah login, redirect ke dashboard)
exports.checkGuest = async (req, res, next) => {
  try {
    // Cek apakah ada token di cookie
    const token = req.cookies.adminToken;
    
    if (!token) {
      // Jika tidak ada token, lanjutkan ke halaman login
      return next();
    }
    
    try {
      // Verifikasi token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Cari user berdasarkan id
      const user = await User.findByPk(decoded.userId);
      
      // Jika user ditemukan dan adalah admin
      if (user && user.isAdmin) {
        return res.redirect('/dashboard');
      }
      
      // Jika token valid tapi user bukan admin, hapus token
      res.clearCookie('adminToken');
      return next();
    } catch (tokenError) {
      // Jika token error, hapus token
      res.clearCookie('adminToken');
      return next();
    }
  } catch (error) {
    console.error('Guest middleware error:', error);
    return next();
  }
};