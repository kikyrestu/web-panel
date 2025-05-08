const { VpsPackage, Order } = require('../../models');
const { Op } = require('sequelize');

// Menampilkan semua paket VPS
exports.getAllPackages = async (req, res) => {
  try {
    // Ambil semua paket VPS
    const packages = await VpsPackage.findAll({
      order: [['price', 'ASC']]
    });
    
    res.render('vps/index', {
      title: 'Manajemen Paket VPS',
      packages
    });
  } catch (error) {
    console.error('Error fetching VPS packages:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat mengambil data paket VPS');
    res.redirect('/dashboard');
  }
};

// Menampilkan form tambah paket VPS baru
exports.showAddPackageForm = (req, res) => {
  res.render('vps/add', {
    title: 'Tambah Paket VPS Baru'
  });
};

// Memproses penambahan paket VPS baru
exports.addPackage = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      cpu,
      ram,
      storage,
      bandwidth,
      ipAddress,
      operatingSystems,
      location,
      isActive,
      discountPercent
    } = req.body;
    
    // Validasi input dasar
    if (!name || !price || !cpu || !ram || !storage) {
      req.flash('error_msg', 'Nama, harga, CPU, RAM, dan storage diperlukan');
      return res.redirect('/vps/add');
    }
    
    // Buat paket VPS baru
    const newPackage = await VpsPackage.create({
      name,
      description,
      price: parseFloat(price),
      specifications: {
        cpu,
        ram,
        storage,
        bandwidth,
        ipAddress,
        operatingSystems: operatingSystems ? operatingSystems.split(',').map(os => os.trim()) : [],
        location
      },
      isActive: isActive === 'true',
      discountPercent: discountPercent ? parseFloat(discountPercent) : 0
    });
    
    req.flash('success_msg', `Paket VPS "${name}" berhasil ditambahkan`);
    res.redirect('/vps');
  } catch (error) {
    console.error('Error adding VPS package:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat menambahkan paket VPS');
    res.redirect('/vps/add');
  }
};

// Menampilkan form edit paket VPS
exports.showEditPackageForm = async (req, res) => {
  try {
    const packageId = req.params.id;
    
    // Ambil data paket VPS
    const vpsPackage = await VpsPackage.findByPk(packageId);
    
    if (!vpsPackage) {
      req.flash('error_msg', 'Paket VPS tidak ditemukan');
      return res.redirect('/vps');
    }
    
    res.render('vps/edit', {
      title: 'Edit Paket VPS',
      vpsPackage
    });
  } catch (error) {
    console.error('Error fetching VPS package for edit:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat mengambil data paket VPS');
    res.redirect('/vps');
  }
};

// Memproses update paket VPS
exports.updatePackage = async (req, res) => {
  try {
    const packageId = req.params.id;
    
    const {
      name,
      description,
      price,
      cpu,
      ram,
      storage,
      bandwidth,
      ipAddress,
      operatingSystems,
      location,
      isActive,
      discountPercent
    } = req.body;
    
    // Validasi input dasar
    if (!name || !price || !cpu || !ram || !storage) {
      req.flash('error_msg', 'Nama, harga, CPU, RAM, dan storage diperlukan');
      return res.redirect(`/vps/${packageId}/edit`);
    }
    
    // Ambil paket VPS
    const vpsPackage = await VpsPackage.findByPk(packageId);
    
    if (!vpsPackage) {
      req.flash('error_msg', 'Paket VPS tidak ditemukan');
      return res.redirect('/vps');
    }
    
    // Update data paket VPS
    vpsPackage.name = name;
    vpsPackage.description = description;
    vpsPackage.price = parseFloat(price);
    vpsPackage.specifications = {
      cpu,
      ram,
      storage,
      bandwidth,
      ipAddress,
      operatingSystems: operatingSystems ? operatingSystems.split(',').map(os => os.trim()) : [],
      location
    };
    vpsPackage.isActive = isActive === 'true';
    vpsPackage.discountPercent = discountPercent ? parseFloat(discountPercent) : 0;
    
    await vpsPackage.save();
    
    req.flash('success_msg', `Paket VPS "${name}" berhasil diperbarui`);
    res.redirect('/vps');
  } catch (error) {
    console.error('Error updating VPS package:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat memperbarui paket VPS');
    res.redirect(`/vps/${req.params.id}/edit`);
  }
};

// Menghapus paket VPS (API)
exports.deletePackage = async (req, res) => {
  try {
    const packageId = req.params.id;
    
    // Cek apakah paket sedang digunakan dalam pesanan
    const ordersWithPackage = await Order.count({
      where: {
        packageId,
        orderType: 'VPS',
        status: {
          [Op.in]: ['pending', 'processing', 'completed']
        }
      }
    });
    
    if (ordersWithPackage > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus paket VPS yang sedang digunakan dalam pesanan aktif'
      });
    }
    
    // Ambil paket VPS
    const vpsPackage = await VpsPackage.findByPk(packageId);
    
    if (!vpsPackage) {
      return res.status(404).json({
        success: false,
        message: 'Paket VPS tidak ditemukan'
      });
    }
    
    // Hapus paket VPS
    await vpsPackage.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Paket VPS berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting VPS package:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus paket VPS',
      error: error.message
    });
  }
};