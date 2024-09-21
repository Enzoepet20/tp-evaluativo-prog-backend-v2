const { DataTypes } = require('sequelize');
const db = require('../database/db');

const Pago = db.define('Pago', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2), // Monto del pago
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users', // Referencia al modelo User
      key: 'id'
    },
    allowNull: false
  }
}, {
  tableName: 'pagos',
  timestamps: false
});

module.exports = Pago;
