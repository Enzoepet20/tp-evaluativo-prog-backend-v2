const request = require('supertest');
const express = require('express');
const multer = require('multer');
const { showAdjuntarRecibo, adjuntarRecibo, uploadRecibo } = require('../controllers/reciboController');
const Recibo = require('../models/Recibo');
const Pago = require('../models/Pago');

// Crea una aplicación Express para las pruebas
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de prueba
app.get('/adjuntar-recibo', showAdjuntarRecibo);
app.post('/adjuntar-recibo', uploadRecibo, adjuntarRecibo);

// Mock de Pago y Recibo
jest.mock('../models/Pago');
jest.mock('../models/Recibo');

describe('Recibo Controller', () => {
    describe('GET /adjuntar-recibo', () => {
        it('debería mostrar el formulario para adjuntar recibo', async () => {
            const mockPagos = [{ id: 1, amount: 100, date: '2024-09-28', userId: 1 }];
            Pago.findAll.mockResolvedValue(mockPagos); // Simula la respuesta de la base de datos

            const response = await request(app).get('/adjuntar-recibo');
            expect(response.status).toBe(200); // Se espera que el estado sea 200
            expect(Pago.findAll).toHaveBeenCalled(); // Verifica que se llamó a findAll
            expect(response.text).toContain('adjuntar-recibo'); // Asumiendo que renderiza esta vista
        });

        it('debería manejar errores al cargar los pagos', async () => {
            Pago.findAll.mockRejectedValue(new Error('Error en la base de datos')); // Simula un error

            const response = await request(app).get('/adjuntar-recibo');
            expect(response.status).toBe(500);
            expect(response.text).toBe('Error al cargar los pagos');
        });
    });

    describe('POST /adjuntar-recibo', () => {
        it('debería adjuntar un recibo correctamente', async () => {
            const mockRecibo = {
                filePath: '/uploads/recibos/recibo-123456789.pdf', // Usa el valor esperado
                pagoId: 1
            };
        
            Recibo.create.mockResolvedValue(mockRecibo);
        
            const response = await request(app)
                .post('/adjuntar-recibo')
                .field('pagoId', '1')
                .attach('recibo', 'path/to/fake.pdf');
        
            expect(response.status).toBe(302); // Espera que redirija al completar
            expect(Recibo.create).toHaveBeenCalledWith(mockRecibo);
        });
        

        it('debería devolver un error si no se adjunta un archivo', async () => {
            const response = await request(app).post('/adjuntar-recibo').send({ pagoId: 1 }); // Falta el archivo

            expect(response.status).toBe(400);
            expect(response.text).toBe('Debe adjuntar un archivo PDF');
        });

        it('debería manejar errores al adjuntar el recibo', async () => {
            const mockFile = {
                fieldname: 'recibo',
                originalname: 'recibo.pdf',
                filename: 'recibo-123456789.pdf'
            };
            const pagoId = 1;

            // Simula el método create de Recibo y fuerza un error
            Recibo.create.mockRejectedValue(new Error('Error en la base de datos'));

            const response = await request(app)
                .post('/adjuntar-recibo')
                .attach('recibo', Buffer.from(''), 'recibo.pdf') // Simula la carga de un archivo PDF
                .field('pagoId', pagoId);

            expect(response.status).toBe(500);
            expect(response.text).toBe('Error al adjuntar el recibo');
        });
    });
});
