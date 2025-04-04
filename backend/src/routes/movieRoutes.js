const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

/**
 * @swagger
 * /api/movies:
 *   get:
 *     summary: Récupère tous les films
 *     responses:
 *       200:
 *         description: Liste des films
 */
router.get('/', movieController.getAllMovies);

/**
 * @swagger
 * /api/movies/random:
 *   get:
 *     summary: Récupère un film aléatoire
 *     responses:
 *       200:
 *         description: Un film aléatoire
 */
router.get('/random', movieController.getRandomMovie);

/**
 * @swagger
 * /api/movies/stats:
 *   get:
 *     summary: Récupère les statistiques des films
 *     responses:
 *       200:
 *         description: Statistiques des films
 */
router.get('/stats', movieController.getMovieStats);

/**
 * @swagger
 * /api/movies/{id}:
 *   get:
 *     summary: Récupère un film par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID du film
 *     responses:
 *       200:
 *         description: Détails du film
 */
router.get('/:id', movieController.getMovieById);

/**
 * @swagger
 * /api/movies/{id}/actors:
 *   get:
 *     summary: Récupère les acteurs d'un film
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID du film
 *     responses:
 *       200:
 *         description: Liste des acteurs du film
 */
router.get('/:id/actors', movieController.getMovieActors);

module.exports = router; 