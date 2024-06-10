const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Game = require('../src/models/gameModel');
const { eleccionNumero, eleccionEquipo, crearJuego, obtenerInfoJuego, actualizarSecuencia } = require('../src/utils/logicaJuego');

jest.mock('../src/utils/logicaJuego', () => ({
    eleccionNumero: jest.fn(() => 1),
    eleccionEquipo: jest.fn(ids => Promise.resolve(ids.map(id => ({ identificador: id, nombre: `Pokemon-${id}`, imagenUrl: `url-${id}` })))),
    crearJuego: jest.fn((equipoInicial, pokemonSequence) => Promise.resolve({ _id: '12345', initialTeam: equipoInicial, pokemonSequence })),
    obtenerInfoJuego: jest.fn(idJuego => Promise.resolve({
        _id: '12345',
        initialTeam: [1, 2, 3, 4, 5, 6],
        pokemonSequence: [1]
    })),
    actualizarSecuencia: jest.fn((idJuego, nuevoPokemon) => Promise.resolve({
        _id: '12345',
        initialTeam: [1, 2, 3, 4, 5, 6],
        pokemonSequence: [1, 2]
    })),
}));

describe('Integración de juegoController', () => {
    describe('GET /api/games/crearJuego', () => {
        it('debe iniciar un juego y validar el formato del equipo', async () => {
            const res = await request(app).get('/api/games/crearJuego');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('idJuego');
            expect(res.body).toHaveProperty('equipoInicial');
            expect(res.body.equipoInicial.length).toBe(6);
            res.body.equipoInicial.forEach(pokemon => {
                expect(pokemon).toHaveProperty('identificador');
                expect(pokemon).toHaveProperty('nombre');
                expect(pokemon).toHaveProperty('imagenUrl');
            });
        });

        it('debe manejar un error al crear el juego', async () => {
            crearJuego.mockImplementationOnce(() => Promise.reject(new Error('Error en crearJuego')));

            const res = await request(app).get('/api/games/crearJuego');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toBe('Error iniciando el juego: Error en crearJuego');
        });
    });

    describe('POST /api/games/enviarSecuencia', () => {
        it('debe continuar la secuencia y validar el formato de la secuencia completa', async () => {
            const res = await request(app)
                .post('/api/games/enviarSecuencia')
                .send({ idJuego: '12345', pokemons: [1] });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('resultado', 'SEGUIR');
            expect(res.body.pokemonSequence.length).toBe(2);
            res.body.pokemonSequence.forEach(pokemon => {
                expect(pokemon).toHaveProperty('identificador');
                expect(pokemon).toHaveProperty('nombre');
                expect(pokemon).toHaveProperty('imagenUrl');
            });
        });

        it('debe manejar un error al comparar la secuencia cuando la secuencia es incorrecta', async () => {
            obtenerInfoJuego.mockImplementationOnce(() => Promise.resolve({
                _id: '12345',
                initialTeam: [1, 2, 3, 4, 5, 6],
                pokemonSequence: [1]
            }));

            const res = await request(app)
                .post('/api/games/enviarSecuencia')
                .send({ idJuego: '12345', pokemons: [2] });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('resultado', 'TERMINADO');
            expect(res.body).toHaveProperty('score', 0);
        });

        it('debe manejar un error al comparar la secuencia cuando no se encuentra el juego', async () => {
            obtenerInfoJuego.mockImplementationOnce(() => Promise.reject(new Error('Juego no encontrado')));

            const res = await request(app)
                .post('/api/games/enviarSecuencia')
                .send({ idJuego: '12345', pokemons: [1] });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toBe('Error comparando la secuencia: Juego no encontrado');
        });
    });
});
