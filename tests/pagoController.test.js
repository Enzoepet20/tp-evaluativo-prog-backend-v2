const request = require('supertest');
const express = require('express');
const { registrarPago, getPagos } = require('../controllers/pagoController');
const Pago = require('../models/Pago');
const Recibo = require('../models/Recibo');

// Crea una aplicación Express para las pruebas
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de prueba
app.post('/registrar-pago', registrarPago);
app.get('/pagos/:id', getPagos);

// Mock de Pago y Recibo
jest.mock('../models/Pago');
jest.mock('../models/Recibo');

describe('Pago Controller', () => {
    describe('POST /registrar-pago', () => {
        it('debería registrar un pago correctamente', async () => {
            // Datos de prueba
            const newPago = { amount: 100, date: '2024-09-28', userId: 1 };
            
            // Simula el método create de Pago
            Pago.create.mockResolvedValue(newPago);

            const response = await request(app).post('/registrar-pago').send(newPago);
            expect(response.status).toBe(302); // Redirecciona al finalizar
            expect(Pago.create).toHaveBeenCalledWith(newPago);
        });

        it('debería devolver un error si falta un campo', async () => {
            const response = await request(app).post('/registrar-pago').send({ amount: 100 }); // Falta 'date' y 'userId'
            expect(response.status).toBe(400);
            expect(response.text).toBe('Todos los campos son obligatorios');
        });

        it('debería manejar errores del servidor', async () => {
            const newPago = { amount: 100, date: '2024-09-28', userId: 1 };
            Pago.create.mockRejectedValue(new Error('Error en la base de datos'));

            const response = await request(app).post('/registrar-pago').send(newPago);
            expect(response.status).toBe(500);
            expect(response.text).toBe('Error al registrar el pago');
        });
    });

    describe('GET /pagos/:id', () => {
        it('debería devolver los pagos del usuario', async () => {
            const mockPagos = [{ id: 1, amount: 100, date: '2024-01-01', userId: userId }];
            Pago.findAll.mockResolvedValue(mockPagos);
        
            const response = await request(app).get(`/pagos/${userId}`);
        
            expect(response.status).toBe(200); // Espera un estado 200
            expect(Pago.findAll).toHaveBeenCalled(); // Verifica que se llamó a findAll
            expect(response.text).toContain('pagos-user'); // Verifica la vista renderizada
        });

        it('debería manejar el caso sin pagos', async () => {
            const userId = 1;
            Pago.findAll.mockResolvedValue([]); // No hay pagos

            const response = await request(app).get(`/pagos/${userId}`);
            expect(response.status).toBe(200); // Debe ser 200
            expect(response.text).toContain('pagos-user'); // Verifica que se renderiza la vista
        });

        it('debería manejar errores del servidor', async () => {
            const userId = 1;
            Pago.findAll.mockRejectedValue(new Error('Error en la base de datos'));

            const response = await request(app).get(`/pagos/${userId}`);
            expect(response.status).toBe(500);
            expect(response.text).toBe('Error al cargar los pagos');
        });
    });
});
