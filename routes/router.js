const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Pago = require('../models/Pago');
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/authController');
const validateController = require('../controllers/validateController');
const { body, validationResult } = require('express-validator');

// Configurar Multer para almacenar las imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/img/'); 
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const imageFileExtensions = ['jpg', 'jpeg', 'png', 'gif'];

const validateProfileImage = body('profileImage').custom((value, { req }) => {
    if (!req.file) {
        throw new Error('No se ha subido ninguna imagen');
    }
    const fileExtension = req.file.mimetype.split('/')[1].toLowerCase();
    if (!imageFileExtensions.includes(fileExtension)) {
        throw new Error('Ingrese un formato de imagen válido');
    }
    return true;
});

// Ruta para la página principal
router.get('/', authController.isAuthenticated,authController.isAuthorized(['admin', 'superuser']), authController.show, (req, res) => {
    res.render('index', { user: req.user, users: req.users, pagos: req.pagos });
});

// Supongamos que esta es tu ruta para mostrar los pagos del usuario específico
router.get('/pagos/:id', authController.isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.id; // Obtener el ID del usuario de la URL
        const pagos = await Pago.findAll({
            where: { userId: userId }, // Filtrar pagos por el ID del usuario
            attributes: ['id', 'amount', 'date', 'userId']
        });
        res.render('pagos-user', { user: req.user, users: req.users, pagos });// Renderiza la vista con los pagos filtrados
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al cargar los pagos');
    }
});

router.get('/register', (req, res) => {
    res.render('register', { validaciones: [] });
});

router.get('/login', (req, res) => {
    const alertMessage = req.query.alert;
    res.render('login', { alert: false });
});

router.get('/edit/:id', authController.isAuthenticated, authController.getUserForEdit);

// Ruta para registrar usuarios
router.post('/register', upload.single('profileImage'), [
    body('name').exists().isLength({ min: 5 }),
    body('correo').exists().isEmail(),
    body('pass').exists().isNumeric(),
    validateProfileImage
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
router.get('/registrar-pago',authController.isAuthorized(['admin', 'superuser']), authController.isAuthenticated, (req, res) => {
    res.render('register-payment', { user: req.user });
});

// Procesar el registro de pago
router.post('/registrar-pago', authController.isAuthenticated, async (req, res) => {
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
});

// Otras rutas
//router.post('/delete/:id', authController.delete);
//router.post('/edit/:id', validateController.uploadProfileImage, authController.edit);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

module.exports = router;
