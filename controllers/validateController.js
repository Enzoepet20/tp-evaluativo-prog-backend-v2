const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');

// Configurar Multer para almacenar las imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const imageFileExtensions = ['jpg', 'jpeg', 'png', 'gif'];

// Middleware para validar la imagen de perfil
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

// Exportar las funciones y el middleware
module.exports = {
    upload,
    validateProfileImage
};
