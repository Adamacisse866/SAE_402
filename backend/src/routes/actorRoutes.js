const express = require('express');
const router = express.Router();
const actorController = require('../controllers/actorController');

router.get('/', actorController.getAllActors);
router.get('/random', actorController.getRandomActor);
router.get('/stats', actorController.getActorStats);
router.get('/:id', actorController.getActorById);
router.get('/:id/movies', actorController.getMoviesByActor);

module.exports = router; 