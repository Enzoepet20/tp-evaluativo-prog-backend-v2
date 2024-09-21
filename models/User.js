const { DataTypes } = require('sequelize');
const db = require('../database/db');

// Modelo de usuario
const User = db.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pass: {
    type: DataTypes.STRING,
    allowNull: false
  },
  profile_image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  role: {
    type: DataTypes.ENUM('superuser', 'admin', 'user'),
    allowNull: false,
    defaultValue: 'user' // Por defecto, el usuario es 'user'
  }
}, {
  tableName: 'users',
  timestamps: false
});

module.exports = User;
