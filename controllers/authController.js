const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const User = require('../models/User'); // Importa tu modelo de Sequelize
const Recibo = require('../models/Recibo'); // Importa tu modelo de Sequelize}
const Pago = require('../models/Pago'); // Importa tu modelo de Sequelize}
const { promisify } = require('util');
const e = require('express');

// Valores reemplazados que estaban en el archivo .env
const JWT_SECRETO = 'super_secret';
const JWT_TIEMPO_EXPIRA = '7d';
const JWT_COOKIE_EXPIRES = 90; // En días




// Middleware para verificar si el usuario está autenticado
// Middleware para verificar si el usuario está autenticado
exports.isAuthenticated = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            const decodificada = await promisify(jwt.verify)(req.cookies.jwt, JWT_SECRETO);

            const userRecord = await User.findByPk(decodificada.id);

            if (!userRecord) {
                // Si no se encuentra el usuario, redirige a /login
                return res.redirect('/login');
            }

            req.user = userRecord;
            return next();
        } catch (error) {
            console.log(error);
            // Si hay un error en la verificación, redirige a /login
            return res.redirect('/login');
        }
    } else {
        // Si no hay JWT, redirige a /login
        return res.redirect('/login');
    }
};
// Middleware para verificar el rol del usuario
exports.isAuthorized = (roles) => {
    return (req, res, next) => {
        // Verifica si el usuario está autenticado y su rol está en los roles permitidos
        if (req.user && roles.includes(req.user.role)) {
            return next(); // Si el rol es correcto, permite continuar
        } else {
            console.log('Acceso denegado, permisos insuficientes');

            // Redirige según el rol del usuario
            if (req.user && req.user.role === 'admin') {
                return res.redirect('/'); // Redirige a la página principal si es admin
            } else {
                return res.redirect('/login?alert=Acceso denegado, permisos insuficientes'); // Redirige al login si es user
            }
        }
    };
};


// Metodo para mostrar la vista principal
exports.show = async (req, res, next) => {
    try {
        const { id, user, name, profile_image } = req.user;

        // Recuperar todos los usuarios desde la base de datos
        const users = await User.findAll({
            attributes: ['id', 'user', 'name', 'correo', 'profile_image']
        });
        const pagos = await Pago.findAll({
            attributes: ['id', 'amount', 'date', 'userId']
        });
        res.render('index', {
            user: { id, user, name, profile_image },
            users: users,
            pagos: pagos,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send('Error al cargar la página principal');
    }
};

// Metodo para mostrar la vista de edición
exports.getUserForEdit = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }
        res.render('edit', { user });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al cargar el usuario');
    }
};

// Procedimiento para registrarnos
exports.register = async (req, res) => {    
    try {
        const { name, user, pass, correo } = req.body;
        const passHash = await bcryptjs.hash(pass, 8);

        // Verifica si se ha subido una imagen y guarda la URL
        let profileImageUrl = '';
        if (req.file) {
            profileImageUrl = `/uploads/${req.file.filename}`;
        }

        // Crea un nuevo usuario en la base de datos
        await User.create({
            user,
            name,
            correo,
            pass: passHash,
            profile_image: profileImageUrl
        });

        res.redirect('/login');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al registrar el usuario');
    }       
};

exports.login = async (req, res) => {
    try {
        const { user, pass } = req.body;

        if (!user || !pass) {
            return res.render('login', {
                alert: true,
                alertTitle: "Advertencia",
                alertMessage: "Ingrese un usuario y password",
                alertIcon: 'info',
                showConfirmButton: true,
                timer: false,
                ruta: 'login'
            });
        }

        // Busca el usuario en la base de datos
        const userRecord = await User.findOne({ where: { user } });

        if (!userRecord || !(await bcryptjs.compare(pass, userRecord.pass))) {
            return res.render('login', {
                alert: true,
                alertTitle: "Error",
                alertMessage: "Usuario y/o Password incorrectas",
                alertIcon: 'error',
                showConfirmButton: true,
                timer: false,
                ruta: 'login'
            });
        }

        // Inicio de sesión OK
        const id = userRecord.id;
        const role = userRecord.role; // Obtener el rol del usuario desde la base de datos
        const token = jwt.sign({ id, role }, JWT_SECRETO, {
            expiresIn: JWT_TIEMPO_EXPIRA
        });

        console.log("TOKEN: " + token + " para el USUARIO : " + user);

        const cookiesOptions = {
            expires: new Date(Date.now() + JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
            httpOnly: true
        };
        res.cookie('jwt', token, cookiesOptions);

        // Redirigir según el rol del usuario
        let redirectRoute = '';
        if (role === 'admin') {
            redirectRoute = 'registrar-pago';
        } else if (role === 'user') {
            redirectRoute = `pagos/${id}`;
        } else if (role === 'superuser') {
            redirectRoute = 'register-admin';
        }
console.log("REDIRECT ROUTE: " + redirectRoute);
        res.render('login', {
            alert: true,
            alertTitle: "Conexión exitosa",
            alertMessage: "¡LOGIN CORRECTO!",
            alertIcon: 'success',
            showConfirmButton: false,
            timer: 800,
            ruta: redirectRoute  // Redirigir a la ruta correspondiente según el rol
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error en el proceso de login');
    }
};



exports.logout = (req, res) => {
    res.clearCookie('jwt');
    return res.redirect('/login');
};

exports.edit = async (req, res) => {
    try {
        const { name, correo, role } = req.body;
        const user = await User.findByPk(req.params.id);
        
        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }

        // Actualiza los campos del usuario
        user.name = name !== undefined ? name : user.name; // Solo actualiza si se proporciona un nuevo valor
        user.correo = correo !== undefined ? correo : user.correo; // Solo actualiza si se proporciona un nuevo valor
        user.role = role !== undefined ? role : user.role; // Solo actualiza si se proporciona un nuevo valor

        // Maneja la imagen de perfil si se proporciona
        if (req.file) {
            user.profile_image = `/uploads/${req.file.filename}`;
        }

        // Guarda los cambios en la base de datos
        await user.save();
        res.redirect('/users-list'); // Redirige a la lista de usuarios o a donde desees
    } catch (error) {
        console.log('Error al editar el usuario:', error);
        res.status(500).send('Error al editar el usuario');
    }
};
exports.delete = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }
        await user.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al borrar el usuario');
    }
}

