const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const GameHostingPackage = sequelize.define('GameHostingPackage', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gameType: {
    type: DataTypes.STRING,
    allowNull: false
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
        size: 10,
        type: 'SSD'
      },
      slots: {
        count: 10,
        unlimited: false
      }
    }
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: {
      ddosProtection: false,
      backup: {
        included: false,
        frequency: null
      },
      modSupport: false,
      controlPanel: null,
      customDomain: false,
      instantSetup: false
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
  tableName: 'game_hosting_packages'
});

module.exports = GameHostingPackage;