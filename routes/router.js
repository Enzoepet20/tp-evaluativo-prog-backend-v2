const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Pago = require('../models/Pago');
const Recibo = require('../models/Recibo');
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/authController');
const validateController = require('../controllers/validateController');
const reciboController = require('../controllers/reciboController');
const pagoController = require('../controllers/pagoController');
const { body, validationResult } = require('express-validator');

// Ruta para listar los pagos con paginación
router.get('/', authController.isAuthenticated, authController.isAuthorized(['admin', 'superuser']), pagoController.obtenerPagos);


// Supongamos que esta es tu ruta para mostrar los pagos del usuario específico
router.get('/pagos/:id', authController.isAuthenticated, pagoController.getPagos) ;


router.get('/register', (req, res) => {
    res.render('register', { validaciones: [] });
});

router.get('/login', (req, res) => {
    const alertMessage = req.query.alert;
    res.render('login', { alert: false, alertMessage });
});

router.get('/edit/:id', authController.isAuthenticated, authController.getUserForEdit);

// Ruta para registrar usuarios
router.post('/register', validateController.upload.single('profileImage'), [
    body('name').exists().isLength({ min: 5 }),
    body('correo').exists().isEmail(),
    body('pass').exists().isNumeric(),
    validateController.validateProfileImage
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const valores = req.body;
        const validaciones = errors.array();
        res.render('register', { validaciones, valores });
    } else {
        authController.register(req, res);
    }
});

// Rutas de pagos

// Mostrar el formulario para registrar un pago
router.get('/registrar-pago', authController.isAuthenticated, authController.isAuthorized(['admin', 'superuser']),(req, res) => {
    res.render('register-payment', { user: req.user });
});

// Procesar el registro de pago
router.post('/registrar-pago', authController.isAuthenticated, pagoController.registrarPago);
// Rutas para manejar recibos
router.get('/adjuntar-recibo', authController.isAuthenticated, authController.isAuthorized(['admin', 'superuser']), reciboController.showAdjuntarRecibo);
router.post('/adjuntar-recibo', (req, res, next) => {
    reciboController.uploadRecibo(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Un error de Multer ocurrió cuando subiendo el archivo
            return res.status(400).send(err.message);
        } else if (err) {
            // Ocurrió un error distinto a Multer
            return res.status(400).send(err.message);
        }
        // Si no hubo error, procede con la siguiente función en la cadena
        next();
    });
}, 
authController.isAuthenticated, 
authController.isAuthorized(['admin', 'superuser']), 
reciboController.adjuntarRecibo);


// Otras rutas
//router.post('/delete/:id', authController.delete);
//router.post('/edit/:id', validateController.uploadProfileImage, authController.edit);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

module.exports = router;
