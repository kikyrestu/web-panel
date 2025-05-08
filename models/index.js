const User = require('./User');
const VpsPackage = require('./VpsPackage');
const WebHostingPackage = require('./WebHostingPackage');
const GameHostingPackage = require('./GameHostingPackage');
const Order = require('./Order');
const Setting = require('./Setting');
const { sequelize } = require('../db');

// Definisikan relasi antar model
User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders'
});

Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'orderUser'  // Mengubah alias dari 'user' menjadi 'orderUser' untuk menghindari konflik
});

// Fungsi untuk sinkronisasi model dengan database
const syncModels = async (force = false) => {
  try {
    await sequelize.sync({ force });
    
    // Inisialisasi pengaturan default setelah sinkronisasi
    await Setting.initDefaults();
    
    console.log('Database dan model berhasil disinkronkan');
    return true;
  } catch (error) {
    console.error('Gagal menyinkronkan database:', error);
    return false;
  }
};

module.exports = {
  User,
  VpsPackage,
  WebHostingPackage,
  GameHostingPackage,
  Order,
  Setting,
  syncModels
};