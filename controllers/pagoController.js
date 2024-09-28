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
    try {
        const userId = req.params.id; // Obtener el ID del usuario de la URL
        const pagos = await Pago.findAll({
            where: { userId: userId }, // Filtrar pagos por el ID del usuario
            attributes: ['id', 'amount', 'date', 'userId']
        });

        // Verificar si hay pagos
        if (!pagos.length) {
            return res.render('pagos-user', { user: req.user, users: req.users, pagos: [], reciboMap: {} });
        }

        // Obtener los filePaths de los recibos
        const recibos = await Recibo.findAll({
            where: { pagoId: pagos.map(pago => pago.id) },
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
        res.render('pagos-user', { user: req.user, users: req.users, pagos, reciboMap });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al cargar los pagos');
    }
};
