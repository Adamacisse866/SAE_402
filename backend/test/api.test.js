const request = require('supertest');
const app = require('../src/index');
const Movie = require('../src/models/movieModel');
const Actor = require('../src/models/actorModel');

let testMovieId;
let testActorId;
let server;

beforeAll(async () => {
    // Récupérer des IDs valides pour les tests
    const movies = await Movie.getAll();
    const actors = await Actor.getAll();
    testMovieId = movies[0].id;
    testActorId = actors[0].id;

    // Démarrer le serveur sur un port différent pour les tests
    server = app.listen(3001);
});

afterAll(async () => {
    // Arrêter le serveur après les tests
    await server.close();
});

describe('API Tests', () => {
    // Tests des Films
    describe('Routes des Films', () => {
        test('GET /api/movies devrait retourner tous les films', async () => {
            const response = await request(app).get('/api/movies');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('title');
        }, 10000);

        test('GET /api/movies/random devrait retourner un film aléatoire', async () => {
            const response = await request(app).get('/api/movies/random');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('title');
        });

        test('GET /api/movies/stats devrait retourner les statistiques des films', async () => {
            const response = await request(app).get('/api/movies/stats');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalMovies');
            expect(response.body).toHaveProperty('avgActorsPerMovie');
        }, 30000);

        test('GET /api/movies/:id/actors devrait retourner les acteurs d\'un film', async () => {
            const response = await request(app).get(`/api/movies/${testMovieId}/actors`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
        });

        test('GET /api/movies/:id devrait retourner un film spécifique', async () => {
            const response = await request(app).get(`/api/movies/${testMovieId}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', testMovieId);
            expect(response.body).toHaveProperty('title');
        });

        test('GET /api/movies/:id devrait retourner 404 pour un ID invalide', async () => {
            const response = await request(app).get('/api/movies/invalid-id');
            expect(response.status).toBe(404);
        });
    });

    // Tests des Acteurs
    describe('Routes des Acteurs', () => {
        test('GET /api/actors devrait retourner tous les acteurs', async () => {
            const response = await request(app).get('/api/actors');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
        });

        test('GET /api/actors/random devrait retourner un acteur aléatoire', async () => {
            const response = await request(app).get('/api/actors/random');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name');
        });

        test('GET /api/actors/stats devrait retourner les statistiques des acteurs', async () => {
            const response = await request(app).get('/api/actors/stats');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalActors');
            expect(response.body).toHaveProperty('totalMoviesWithActors');
            expect(response.body).toHaveProperty('avgActorsPerMovie');
        }, 60000);

        test('GET /api/actors/:id/movies devrait retourner les films d\'un acteur', async () => {
            const response = await request(app).get(`/api/actors/${testActorId}/movies`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
        });

        test('GET /api/actors/:id devrait retourner un acteur spécifique', async () => {
            const response = await request(app).get(`/api/actors/${testActorId}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', testActorId);
            expect(response.body).toHaveProperty('name');
        });

        test('GET /api/actors/:id devrait retourner 404 pour un ID invalide', async () => {
            const response = await request(app).get('/api/actors/invalid-id');
            expect(response.status).toBe(404);
        });
    });

    // Tests du Jeu
    describe('Routes du Jeu', () => {
        test('GET /api/game/start devrait démarrer une nouvelle partie', async () => {
            const response = await request(app).get('/api/game/start');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('type');
            expect(['movie', 'actor']).toContain(response.body.type);
            expect(response.body).toHaveProperty('data');
        });

        test('POST /api/game/progress devrait sauvegarder la progression', async () => {
            const gameState = {
                currentMovie: testMovieId,
                discoveredActors: [testActorId],
                score: 100,
                timeSpent: 30,
                currentLevel: 1,
                combo: 2
            };
            const response = await request(app)
                .post('/api/game/progress')
                .send(gameState);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('bonus');
            expect(response.body).toHaveProperty('totalScore');
        });

        test('GET /api/game/level-config devrait retourner la configuration des niveaux', async () => {
            const response = await request(app).get('/api/game/level-config');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('1');
            expect(response.body).toHaveProperty('2');
            expect(response.body['1']).toHaveProperty('hintCost');
            expect(response.body['1']).toHaveProperty('wrongAnswerPenalty');
        });

        test('GET /api/game/leaderboard devrait retourner le classement', async () => {
            const response = await request(app).get('/api/game/leaderboard');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
        });

        test('GET /api/game/movies/:id/hint devrait retourner un indice pour un film', async () => {
            const response = await request(app).get(`/api/game/movies/${testMovieId}/hint`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('connection_count');
        });

        test('GET /api/game/movies/:id/wiki devrait retourner des informations Wikipedia', async () => {
            const response = await request(app).get(`/api/game/movies/${testMovieId}/wiki`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('title');
            expect(response.body).toHaveProperty('extract');
            expect(response.body).toHaveProperty('imageUrl');
            expect(response.body).toHaveProperty('fullUrl');
        });

        test('GET /api/game/actors/:id/wiki devrait retourner des informations Wikipedia', async () => {
            const response = await request(app).get(`/api/game/actors/${testActorId}/wiki`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('title');
            expect(response.body).toHaveProperty('extract');
            expect(response.body).toHaveProperty('imageUrl');
            expect(response.body).toHaveProperty('fullUrl');
        });
    });

    // Tests de Recherche et Connexions
    describe('Routes de Recherche et Connexions', () => {
        test('GET /api/connections/search devrait retourner des résultats de recherche', async () => {
            const response = await request(app).get('/api/connections/search?q=test');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
        });

        test('GET /api/connections/:id devrait retourner les connexions', async () => {
            const response = await request(app).get(`/api/connections/${testMovieId}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('type');
            expect(response.body).toHaveProperty('connections');
            expect(Array.isArray(response.body.connections)).toBeTruthy();
        });

        test('GET /api/connections/stats devrait retourner les statistiques globales', async () => {
            const response = await request(app).get('/api/connections/stats');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalMovies');
            expect(response.body).toHaveProperty('totalActors');
            expect(response.body).toHaveProperty('totalGenres');
            expect(response.body).toHaveProperty('totalConnections');
        });
    });

    // Tests d'Erreurs
    describe('Gestion des Erreurs', () => {
        test('Devrait retourner 404 pour une route inexistante', async () => {
            const response = await request(app).get('/api/route-inexistante');
            expect(response.status).toBe(404);
        });

        test('Devrait retourner 400 pour une requête invalide', async () => {
            const response = await request(app)
                .post('/api/game/progress')
                .send({});
            expect(response.status).toBe(400);
        });
    });
}); 