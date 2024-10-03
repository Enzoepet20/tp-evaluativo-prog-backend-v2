require("dotenv").config();
var sequelize = require("sequelize");

var db = new sequelize(
    'tp_evaluativo_prog_backend_renacido', // Nombre de la base de datos
    'root', // Usuario predeterminado de XAMPP
    '', // La contraseña predeterminada de XAMPP es vacía
    {
        dialect: "mysql",
        host: 'localhost', // Host predeterminado
        port: 3306, // Puerto predeterminado para MySQL
    }
);

module.exports = db;

