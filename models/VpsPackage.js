const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const VpsPackage = sequelize.define('VpsPackage', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  specifications: {
    type: DataTypes.JSONB,
    defaultValue: {
      cpu: {
        cores: 1,
        description: 'Standard CPU'
      },
      ram: {
        size: 1,
        description: 'DDR4'
      },
      storage: {
        size: 20,
        type: 'SSD'
      },
      bandwidth: {
        limit: 1000,
        unlimited: false
      },
      os: []
    }
  },
  location: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  pricing: {
    type: DataTypes.JSONB,
    defaultValue: {
      monthly: 0,
      quarterly: 0,
      yearly: 0,
      setup: 0
    }
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  discount: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  features: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'VPS'
  },
  orderCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'vps_packages'
});

module.exports = VpsPackage;