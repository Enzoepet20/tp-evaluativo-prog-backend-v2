const Recibo = require('../models/Recibo');
const Pago = require('../models/Pago');
const multer = require('multer');
const path = require('path');

// Configurar Multer para almacenar los archivos PDF
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/recibos'); // Carpeta donde se almacenarán los recibos
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Mostrar el formulario para adjuntar recibo
exports.showAdjuntarRecibo = async (req, res) => {
    try {
        const pagos = await Pago.findAll({
            attributes: ['id', 'amount', 'date', 'userId']
        });
        res.render('adjuntar-recibo', { pagos });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar los pagos');
    }
};

// Procesar el adjunto de recibo
exports.adjuntarRecibo = async (req, res) => {
    try {
        const { pagoId } = req.body;
        
        if (!req.file) {
            return res.status(400).send('Debe adjuntar un archivo PDF');
        }

        // Crear el recibo en la base de datos
        await Recibo.create({
            filePath: `/uploads/recibos/${req.file.filename}`,
            pagoId
        });

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al adjuntar el recibo');
    }
};
