const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const User = require('./User');

const Order = sequelize.define('Order', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  orderType: {
    type: DataTypes.ENUM('VPS', 'WebHosting', 'GameHosting'),
    allowNull: false
  },
  packageId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  packageModel: {
    type: DataTypes.STRING,
    allowNull: false
  },
  serviceName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  domainName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'quarterly', 'yearly'),
    defaultValue: 'monthly'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled', 'failed', 'expired'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentDetails: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  serverDetails: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  renewalReminder: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'orders'
});

// Definisikan hubungan
Order.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

module.exports = Order;