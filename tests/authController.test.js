const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const authController = require('../controllers/authController');
const User = require('../models/User'); // Mockear
const { promisify } = require('util');

// Mockeamos los métodos de los modelos y de otras funciones necesarias
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../models/User');
jest.mock('util', () => ({
    promisify: jest.fn()
}));

describe('authController', () => {
    
    describe('isAuthenticated', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                cookies: {
                    jwt: 'valid-token'
                }
            };
            res = {
                redirect: jest.fn()
            };
            next = jest.fn();
        });

        it('debería autenticar al usuario si el JWT es válido', async () => {
            const decodedToken = { id: 1 };
            const user = { id: 1, name: 'Test User' };

            promisify.mockResolvedValueOnce(() => decodedToken);
            User.findByPk.mockResolvedValueOnce(user);

            await authController.isAuthenticated(req, res, next);

            expect(User.findByPk).toHaveBeenCalledWith(decodedToken.id);
            expect(req.user).toEqual(user);
            expect(next).toHaveBeenCalled();
        });

        it('debería redirigir a /login si el usuario no es encontrado', async () => {
            const decodedToken = { id: 1 };
            
            promisify.mockResolvedValueOnce(() => decodedToken);
            User.findByPk.mockResolvedValueOnce(null);

            await authController.isAuthenticated(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/login');
            expect(next).not.toHaveBeenCalled();
        });

        it('debería redirigir a /login si no hay JWT', async () => {
            req.cookies.jwt = null;

            await authController.isAuthenticated(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/login');
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('isAuthorized', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                user: {
                    role: 'admin'
                }
            };
            res = {
                redirect: jest.fn()
            };
            next = jest.fn();
        });

        it('debería permitir el acceso si el rol del usuario está en los roles permitidos', () => {
            const middleware = authController.isAuthorized(['admin', 'superuser']);
            
            middleware(req, res, next);
            
            expect(next).toHaveBeenCalled();
        });

        it('debería redirigir a /login si el rol del usuario no es permitido', () => {
            const middleware = authController.isAuthorized(['user']);
            
            middleware(req, res, next);
            
            expect(res.redirect).toHaveBeenCalledWith('/login?alert=Acceso denegado, permisos insuficientes');
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('register', () => {
        let req, res;

        beforeEach(() => {
            req = {
                body: {
                    name: 'Test User',
                    user: 'testuser',
                    pass: 'password123',
                    correo: 'test@example.com'
                },
                file: {
                    filename: 'profile.jpg'
                }
            };
            res = {
                redirect: jest.fn(),
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };
        });

        it('debería registrar un nuevo usuario y redirigir a /login', async () => {
            bcryptjs.hash.mockResolvedValueOnce('hashedpassword');
            User.create.mockResolvedValueOnce({});

            await authController.register(req, res);

            expect(bcryptjs.hash).toHaveBeenCalledWith(req.body.pass, 8);
            expect(User.create).toHaveBeenCalledWith({
                user: req.body.user,
                name: req.body.name,
                correo: req.body.correo,
                pass: 'hashedpassword',
                profile_image: `/uploads/${req.file.filename}`
            });
            expect(res.redirect).toHaveBeenCalledWith('/login');
        });

        it('debería manejar un error en el registro', async () => {
            bcryptjs.hash.mockRejectedValueOnce(new Error('Error en el hash'));
            
            await authController.register(req, res);
            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Error al registrar el usuario');
        });
    });

    describe('login', () => {
        let req, res;

        beforeEach(() => {
            req = {
                body: {
                    user: 'testuser',
                    pass: 'password123'
                }
            };
            res = {
                render: jest.fn(),
                cookie: jest.fn()
            };
        });

        it('debería iniciar sesión correctamente y redirigir al dashboard', async () => {
            const user = { id: 1, user: 'testuser', pass: 'hashedpassword', role: 'admin' };

            User.findOne.mockResolvedValueOnce(user);
            bcryptjs.compare.mockResolvedValueOnce(true);
            jwt.sign.mockReturnValue('valid-token');

            await authController.login(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ where: { user: req.body.user } });
            expect(bcryptjs.compare).toHaveBeenCalledWith(req.body.pass, user.pass);
            expect(res.cookie).toHaveBeenCalledWith('jwt', 'valid-token', expect.any(Object));
            expect(res.render).toHaveBeenCalledWith('login', expect.any(Object));
        });

        it('debería manejar un error si el usuario o contraseña son incorrectos', async () => {
            User.findOne.mockResolvedValueOnce(null);

            await authController.login(req, res);

            expect(res.render).toHaveBeenCalledWith('login', expect.objectContaining({
                alertTitle: "Error",
                alertMessage: "Usuario y/o Password incorrectas"
            }));
        });
    });
});
