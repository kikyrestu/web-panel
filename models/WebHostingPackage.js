const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const WebHostingPackage = sequelize.define('WebHostingPackage', {
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
      storage: {
        size: 1,
        type: 'SSD'
      },
      bandwidth: {
        limit: 10,
        unlimited: false
      },
      domains: {
        included: 1,
        addon: 0
      },
      databases: {
        mysql: 1,
        unlimited: false
      },
      emailAccounts: {
        count: 1,
        unlimited: false
      }
    }
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: {
      cpanel: false,
      ssl: {
        included: false,
        type: null
      },
      backups: {
        included: false,
        frequency: null
      },
      wordpress: {
        oneClick: false,
        staging: false
      }
    }
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
  category: {
    type: DataTypes.STRING,
    defaultValue: 'Basic'
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
  tableName: 'web_hosting_packages'
});

module.exports = WebHostingPackage;