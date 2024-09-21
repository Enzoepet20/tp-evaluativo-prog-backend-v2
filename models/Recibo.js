const { DataTypes } = require('sequelize');
const db = require('../database/db');
const Recibo = db.define('Recibo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filePath: {
    type: DataTypes.STRING, // Ruta del archivo PDF
    allowNull: false
  },
  pagoId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'pagos', // Referencia al modelo Pago
      key: 'id'
    },
    allowNull: false
  }
}, {
  tableName: 'recibos',
  timestamps: false
});

module.exports = Recibo;
