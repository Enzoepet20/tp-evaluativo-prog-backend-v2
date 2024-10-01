const bcryptjs = require('bcryptjs');
const User = require('../models/User');

// Función para renderizar el formulario
exports.renderRegisterForm = (req, res) => {
    res.render('register-admin'); // Nombre del archivo EJS
  };
  
  // Controlador para registrar usuarios por un superusuario
// Procedimiento para registrarnos
exports.registerUser = async (req, res) => {    
    try {
        const { name, user, pass, correo, role } = req.body; // Añadido el role
        const passHash = await bcryptjs.hash(pass, 8);


        // Verifica si se ha subido una imagen y guarda la URL
        let profileImageUrl = '';
        if (req.file) {
            profileImageUrl = `/uploads/${req.file.filename}`;
        }
        console.log("BODY: ", req.body);
        console.log("FILES: ", req.file);

        // Crea un nuevo usuario en la base de datos, incluyendo el rol
        await User.create({
            user,
            name,
            correo,
            pass: passHash,
            role,
            profile_image: profileImageUrl
        });

        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al registrar el usuario ');
    }       
};
exports.getUsersList = async (req, res) => {
    try {
      // Obtiene todos los usuarios de la base de datos
      const users = await User.findAll({
        attributes: ['id', 'name', 'user', 'correo', 'role']
      });
  
      // Renderiza la vista 'users-list' y pasa los usuarios obtenidos
      res.render('users-list', { users });
    } catch (error) {
      console.log('Error al obtener la lista de usuarios:', error);
      res.status(500).send('Error al cargar la lista de usuarios');
    }
  };

