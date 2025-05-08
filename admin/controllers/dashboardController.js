const { User, Order, VpsPackage, WebHostingPackage, GameHostingPackage } = require('../../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Menampilkan dashboard utama
exports.showDashboard = async (req, res) => {
  try {
    // Ambil statistik untuk ditampilkan di dashboard
    
    // Total user
    const totalUsers = await User.count();
    
    // Total admin
    const totalAdmins = await User.count({
      where: { isAdmin: true }
    });
    
    // Total pesanan
    const totalOrders = await Order.count();
    
    // Pesanan yang pending
    const pendingOrders = await Order.count({
      where: { status: 'pending' }
    });
    
    // Pesanan yang completed
    const completedOrders = await Order.count({
      where: { status: 'completed' }
    });
    
    // Total pendapatan
    const revenue = await Order.sum('totalAmount', {
      where: { status: 'completed' }
    });
    
    // Pesanan bulan ini
    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();
    
    const ordersThisMonth = await Order.count({
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });
    
    // Pendapatan bulan ini
    const revenueThisMonth = await Order.sum('totalAmount', {
      where: {
        status: 'completed',
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });
    
    // Pesanan terbaru
    const recentOrders = await Order.findAll({
      include: [
        { model: User, as: 'user' }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    // Pengguna terbaru
    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    // Total paket layanan
    const totalVpsPackages = await VpsPackage.count();
    const totalWebHostingPackages = await WebHostingPackage.count();
    const totalGameHostingPackages = await GameHostingPackage.count();
    
    // Render dashboard
    res.render('dashboard/index', {
      title: 'Admin Dashboard',
      stats: {
        totalUsers,
        totalAdmins,
        totalOrders,
        pendingOrders,
        completedOrders,
        revenue: revenue || 0,
        ordersThisMonth,
        revenueThisMonth: revenueThisMonth || 0,
        totalVpsPackages,
        totalWebHostingPackages,
        totalGameHostingPackages
      },
      recentOrders,
      recentUsers,
      moment // Untuk format tanggal di template
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat memuat dashboard');
    res.status(500).render('dashboard/index', {
      title: 'Admin Dashboard',
      stats: {},
      recentOrders: [],
      recentUsers: [],
      moment
    });
  }
};

// Menampilkan halaman analitik
exports.showAnalytics = async (req, res) => {
  try {
    const period = req.query.period || 'monthly'; // default: monthly
    let startDate, endDate, format, groupBy;
    
    // Set rentang waktu berdasarkan periode
    switch (period) {
      case 'daily':
        startDate = moment().subtract(30, 'days').startOf('day');
        endDate = moment().endOf('day');
        format = 'YYYY-MM-DD';
        groupBy = 'day';
        break;
      case 'weekly':
        startDate = moment().subtract(12, 'weeks').startOf('week');
        endDate = moment().endOf('week');
        format = 'YYYY-[W]WW';
        groupBy = 'week';
        break;
      case 'monthly':
      default:
        startDate = moment().subtract(12, 'months').startOf('month');
        endDate = moment().endOf('month');
        format = 'YYYY-MM';
        groupBy = 'month';
        break;
    }
    
    // Query untuk mengambil data order berdasarkan periode
    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate.toDate(), endDate.toDate()]
        }
      },
      order: [['createdAt', 'ASC']]
    });
    
    // Kelompokkan data berdasarkan periode
    const orderData = {};
    const revenueData = {};
    
    orders.forEach(order => {
      const dateKey = moment(order.createdAt).format(format);
      
      if (!orderData[dateKey]) {
        orderData[dateKey] = 0;
      }
      orderData[dateKey] += 1;
      
      if (order.status === 'completed') {
        if (!revenueData[dateKey]) {
          revenueData[dateKey] = 0;
        }
        revenueData[dateKey] += parseFloat(order.totalAmount);
      }
    });
    
    // Data pengguna berdasarkan paket
    const vpsOrders = await Order.count({
      where: { orderType: 'VPS' }
    });
    
    const webHostingOrders = await Order.count({
      where: { orderType: 'WebHosting' }
    });
    
    const gameHostingOrders = await Order.count({
      where: { orderType: 'GameHosting' }
    });
    
    const packageDistribution = {
      labels: ['VPS', 'Web Hosting', 'Game Hosting'],
      data: [vpsOrders, webHostingOrders, gameHostingOrders]
    };
    
    res.render('dashboard/analytics', {
      title: 'Analytics',
      period,
      orderData: JSON.stringify(orderData),
      revenueData: JSON.stringify(revenueData),
      packageDistribution: JSON.stringify(packageDistribution)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat memuat analitik');
    res.redirect('/dashboard');
  }
};