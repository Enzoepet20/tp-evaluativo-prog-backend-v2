const Recibo = require('../models/Recibo');
const Pago = require('../models/Pago');
const multer = require('multer');
const path = require('path');

exports.registrarPago = async (req, res) => {
    const { amount, date, userId } = req.body;
    try {
        if (!amount || !date || !userId) {
            return res.status(400).send('Todos los campos son obligatorios');
        }
        await Pago.create({ amount, date, userId });
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al registrar el pago');
    }
};


exports.getPagos = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Página actual (1 por defecto)
    const limit = 10; // Número de pagos por página
    const offset = (page - 1) * limit; // Desplazamiento para la paginación
    const userId = req.params.id; // Obtener el ID del usuario de la URL

    try {
        // Obtener pagos para el usuario específico
        const { count, rows: pagosUsuario } = await Pago.findAndCountAll({
            where: { userId: userId }, // Filtrar pagos por el ID del usuario
            limit,
            offset,
            order: [['date', 'DESC']],
            attributes: ['id', 'amount', 'date', 'userId']
        });

        const totalPages = Math.ceil(count / limit);

        // Verificar si hay pagos
        if (!pagosUsuario.length) {
            return res.render('pagos-user', {
                user: req.user, // Asegúrate de pasar la variable user
                users: req.users,
                pagos: [],
                reciboMap: {},
                currentPage: page,
                totalPages
            });
        }

        // Obtener los filePaths de los recibos
        const recibos = await Recibo.findAll({
            where: { pagoId: pagosUsuario.map(pago => pago.id) },
            attributes: ['pagoId', 'filePath']
        });

        // Mapeamos los recibos para poder acceder a ellos fácilmente
        const reciboMap = {};
        recibos.forEach(recibo => {
            reciboMap[recibo.pagoId] = recibo.filePath;
        });

        // Log para verificar el contenido de reciboMap
        console.log('Recibo Map:', reciboMap);

        // Renderizar la vista con los pagos y sus recibos
        res.render('pagos-user', {
            user: req.user, // Asegúrate de pasar la variable user
            users: req.users,
            pagos: pagosUsuario,
            reciboMap,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener los pagos.');
    }
};




// Ejemplo de controlador para obtener pagos con paginación
exports.obtenerPagos = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 20; // Número de pagos por página
    const offset = (page - 1) * limit;
  
    const { count, rows: pagos } = await Pago.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [['date', 'DESC']] // Ordenar por fecha de pago
    });
  
    const totalPages = Math.ceil(count / limit);
  
    res.render('index', {
      pagos: pagos,
      currentPage: page,
      totalPages: totalPages,
      user: req.user
    });
  };
  
  exports.obtenerPagosUserId = async (req, res) => {
   
};