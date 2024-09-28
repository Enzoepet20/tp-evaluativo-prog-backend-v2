const User = require('./User');
const Pago = require('./Pago');
const Recibo = require('./Recibo');

// Definir relaciones correctamente
User.hasMany(Pago, { foreignKey: 'userId' });
Pago.belongsTo(User, { foreignKey: 'userId' });

Pago.hasOne(Recibo, { foreignKey: 'pagoId' });
Recibo.belongsTo(Pago, { foreignKey: 'pagoId' });
console.log(User.associations);
console.log(Pago.associations);

// Exportar los modelos con relaciones
module.exports = { User, Pago, Recibo };
