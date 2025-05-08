// Settings model
const { DataTypes } = require('sequelize');
const sequelize = require('../db').sequelize;

const Setting = sequelize.define('Setting', {
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    primaryKey: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('text', 'number', 'boolean', 'json', 'password'),
    defaultValue: 'text',
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'general',
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: true,
});

// Fungsi helper untuk mendapatkan pengaturan berdasarkan key
Setting.getSetting = async function(key, defaultValue = null) {
  try {
    const setting = await this.findByPk(key);
    if (!setting) return defaultValue;
    
    // Parse nilai berdasarkan tipe
    switch (setting.type) {
      case 'number':
        return parseFloat(setting.value);
      case 'boolean':
        return setting.value === 'true';
      case 'json':
        return JSON.parse(setting.value);
      default:
        return setting.value;
    }
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
};

// Fungsi helper untuk memperbarui pengaturan
Setting.updateSetting = async function(key, value, options = {}) {
  try {
    let valueToStore = value;
    
    // Konversi nilai berdasarkan tipe yang ditetapkan
    if (options.type === 'json' && typeof value !== 'string') {
      valueToStore = JSON.stringify(value);
    }
    
    const [setting, created] = await this.findOrCreate({
      where: { key },
      defaults: {
        value: valueToStore,
        type: options.type || 'text',
        category: options.category || 'general',
        description: options.description,
        isPublic: options.isPublic || false
      }
    });
    
    if (!created) {
      await setting.update({
        value: valueToStore,
        ...(options.type && { type: options.type }),
        ...(options.category && { category: options.category }),
        ...(options.description && { description: options.description }),
        ...(typeof options.isPublic !== 'undefined' && { isPublic: options.isPublic })
      });
    }
    
    return setting;
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    throw error;
  }
};

// Fungsi untuk mengambil semua pengaturan berdasarkan kategori
Setting.getSettingsByCategory = async function(category = null) {
  try {
    const where = {};
    if (category) where.category = category;
    
    const settings = await this.findAll({ where });
    return settings;
  } catch (error) {
    console.error('Error getting settings by category:', error);
    return [];
  }
};

// Fungsi untuk inisialisasi pengaturan default
Setting.initDefaults = async function() {
  const defaults = [
    { key: 'BOT_TOKEN', value: process.env.BOT_TOKEN || '', type: 'password', category: 'telegram', description: 'Token Bot Telegram' },
    { key: 'ADMIN_ID', value: process.env.ADMIN_ID || '', type: 'text', category: 'telegram', description: 'ID Admin Telegram' },
    { key: 'ADMIN_USERNAME', value: process.env.ADMIN_USERNAME || '', type: 'text', category: 'telegram', description: 'Username Admin Telegram' },
    { key: 'PAYMENT_API_KEY', value: process.env.PAYMENT_API_KEY || '', type: 'password', category: 'payment', description: 'API Key Payment Gateway' },
    { key: 'SITE_NAME', value: 'HostingBot', type: 'text', category: 'general', description: 'Nama Situs' },
    { key: 'SITE_DESCRIPTION', value: 'Bot Penyedia Jasa Hosting', type: 'text', category: 'general', description: 'Deskripsi Situs' },
    { key: 'MAINTENANCE_MODE', value: 'false', type: 'boolean', category: 'general', description: 'Mode Maintenance' }
  ];
  
  for (const setting of defaults) {
    await this.updateSetting(setting.key, setting.value, {
      type: setting.type,
      category: setting.category,
      description: setting.description,
      isPublic: setting.isPublic || false
    });
  }
  
  console.log('Default settings initialized');
};

module.exports = Setting;
