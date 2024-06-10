const { eleccionNumero, _getPokemonInfo, eleccionEquipo, crearJuego, obtenerInfoJuego, actualizarSecuencia } = require('../src/utils/logicaJuego');
const axios = require('axios');
const Game = require('../src/models/gameModel');

jest.mock('axios');
jest.mock('../src/models/gameModel');

describe('logicaJuego functions', () => {
    // Pruebas para eleccionNumero
    it('eleccionNumero should return a number between the range', () => {
        const num = eleccionNumero(1, 100);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(100);
    });

    it('eleccionNumero should throw an error if invalid range is provided', () => {
        expect(() => eleccionNumero(100, 1)).toThrow('Rango inválido: inicio es mayor que fin');
    });

    // Pruebas para _getPokemonInfo
    it('_getPokemonInfo should return correct pokemon data', async () => {
        const mockData = {
            data: {
                id: 1,
                name: 'bulbasaur',
                sprites: { front_default: 'image_url' }
            }
        };
        axios.get.mockResolvedValue(mockData);
        const data = await _getPokemonInfo(1);
        expect(data).toEqual({ identificador: 1, nombre: 'bulbasaur', imagenUrl: 'image_url' });
    });

    it('_getPokemonInfo should throw an error if API call fails', async () => {
        axios.get.mockRejectedValue(new Error('API call failed'));
        await expect(_getPokemonInfo(1)).rejects.toThrow('API call failed');
    });

    // Pruebas para eleccionEquipo
    it('eleccionEquipo should return an array of pokemon info', async () => {
        const mockData = {
            data: {
                id: 1,
                name: 'bulbasaur',
                sprites: { front_default: 'image_url' }
            }
        };
        axios.get.mockResolvedValue(mockData);
        const equipo = await eleccionEquipo([1, 2, 3, 4, 5, 6]);
        expect(equipo).toHaveLength(6);
        expect(equipo[0]).toEqual({ identificador: 1, nombre: 'bulbasaur', imagenUrl: 'image_url' });
    });

    it('eleccionEquipo should throw an error if one of the API calls fails', async () => {
        axios.get.mockRejectedValueOnce(new Error('API call failed'));
        await expect(eleccionEquipo([1, 2, 3, 4, 5, 6])).rejects.toThrow('API call failed');
    });

    // Pruebas para crearJuego
    it('crearJuego should create and return a game', async () => {
        const mockGame = { _id: '123', initialTeam: [1, 2, 3, 4, 5, 6], pokemonSequence: [] };
        Game.prototype.save = jest.fn().mockResolvedValue(mockGame);
        const juego = await crearJuego([1, 2, 3, 4, 5, 6]);
        expect(juego).toEqual(mockGame);
    });

    it('crearJuego should throw an error if saving game fails', async () => {
        Game.prototype.save = jest.fn().mockRejectedValue(new Error('Save failed'));
        await expect(crearJuego([1, 2, 3, 4, 5, 6])).rejects.toThrow('Save failed');
    });

    // Pruebas para obtenerInfoJuego
    it('obtenerInfoJuego should return game info', async () => {
        const mockGame = { _id: '123', initialTeam: [1, 2, 3, 4, 5, 6], pokemonSequence: [] };
        Game.findById = jest.fn().mockResolvedValue(mockGame);
        const juego = await obtenerInfoJuego('123');
        expect(juego).toEqual(mockGame);
    });

    it('obtenerInfoJuego should throw an error if game is not found', async () => {
        Game.findById = jest.fn().mockResolvedValue(null);
        await expect(obtenerInfoJuego('123')).rejects.toThrow('Juego no encontrado');
    });

    // Pruebas para actualizarSecuencia
    it('actualizarSecuencia should update game sequence', async () => {
        const mockUpdatedGame = {
            _id: '123',
            initialTeam: [1, 2, 3, 4, 5, 6],
            pokemonSequence: [7]
        };
        Game.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedGame);
        const result = await actualizarSecuencia('123', 7);
        expect(result).toEqual(mockUpdatedGame);
    });

    it('actualizarSecuencia should throw an error if update fails', async () => {
        Game.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));
        await expect(actualizarSecuencia('123', 7)).rejects.toThrow('Update failed');
    });
});
