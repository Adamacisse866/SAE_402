const express = require('express');
const router = express.Router();
const gameModel = require('../models/gameModel');
const gameController = require('../controllers/gameController');

// Démarrer une nouvelle partie
router.get('/start', gameController.startNewGame);

// Sauvegarder la progression
router.post('/progress', gameController.saveProgress);

// Obtenir un indice pour un film
router.get('/movies/:id/hint', async (req, res) => {
    try {
        const hint = await gameModel.getHint(req.params.id);
        if (!hint) {
            return res.status(404).json({ message: 'Aucun indice disponible' });
        }
        res.json(hint);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'indice' });
    }
});

// Obtenir les informations Wikipedia d'un film
router.get('/movies/:id/wiki', (req, res) => {
    req.query.type = 'movie';
    gameController.getWikiInfo(req, res);
});

// Obtenir les informations Wikipedia d'un acteur
router.get('/actors/:id/wiki', (req, res) => {
    req.query.type = 'actor';
    gameController.getWikiInfo(req, res);
});

// Obtenir le classement
router.get('/leaderboard', gameController.getLeaderboard);

// Obtenir la configuration des niveaux
router.get('/level-config', gameController.getLevelConfig);

module.exports = router; 