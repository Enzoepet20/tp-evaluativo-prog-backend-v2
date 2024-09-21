const User = require('./User');
const Pago = require('./Pago');
const Recibo = require('./Recibo');

// Definir relaciones
User.hasMany(Pago, { foreignKey: 'userId' });
Pago.belongsTo(User, { foreignKey: 'userId' });

Pago.hasOne(Recibo, { foreignKey: 'pagoId' });
Recibo.belongsTo(Pago, { foreignKey: 'pagoId' });

module.exports = { User, Pago, Recibo };