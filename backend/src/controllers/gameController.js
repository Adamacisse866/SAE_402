const Game = require('../models/gameModel');

const startNewGame = async (req, res) => {
    try {
        const game = await Game.startNewGame();
        res.json(game);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const saveProgress = async (req, res) => {
    try {
        const { currentMovie, discoveredActors, score, timeSpent, currentLevel, combo } = req.body;
        
        // Validation des données requises
        if (!currentMovie || !Array.isArray(discoveredActors) || 
            typeof score !== 'number' || typeof timeSpent !== 'number' ||
            typeof currentLevel !== 'number' || typeof combo !== 'number') {
            return res.status(400).json({ 
                message: 'Données invalides. Tous les champs sont requis et doivent être du bon type.' 
            });
        }

        // Validation des valeurs
        if (score < 0 || timeSpent < 0 || currentLevel < 1 || combo < 0) {
            return res.status(400).json({ 
                message: 'Les valeurs numériques doivent être positives.' 
            });
        }

        // Calculer le bonus en fonction du niveau
        let bonus = 0;
        if (currentLevel === 2) {
            // Bonus de temps pour le niveau 2
            bonus = Math.min(25, Math.floor((30 - timeSpent) / 2));
            
            // Appliquer les bonus de combo
            if (combo >= 3 && combo < 5) {
                bonus += 10; // Bonus pour combo x3
            } else if (combo >= 5 && combo < 7) {
                bonus += 20; // Bonus pour combo x5
            } else if (combo >= 7) {
                bonus += 30; // Bonus pour combo x7
            }
        }

        // Calculer le score total
        let totalScore = score + bonus;

        // Sauvegarder la progression
        const result = await Game.saveProgress({
            currentMovie,
            discoveredActors,
            score,
            timeSpent,
            bonus,
            totalScore
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getWikiInfo = async (req, res) => {
    try {
        const wikiInfo = await Game.getWikiInfo(req.params.id, req.query.type);
        if (!wikiInfo) {
            return res.status(404).json({ message: 'Information non trouvée' });
        }
        res.json(wikiInfo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Game.getLeaderboard();
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLevelConfig = async (req, res) => {
    try {
        const config = {
            1: {
                hintCost: 5,
                wrongAnswerPenalty: -10,
                maxCombo: 3,
                pointsPerCorrectAnswer: 50,
                maxHintsPerGuess: null,
                timeLimit: null
            },
            2: {
                hintCost: 10,
                wrongAnswerPenalty: -20,
                maxCombo: 7,
                pointsPerCorrectAnswer: 75,
                maxHintsPerGuess: 4,
                timeLimit: 30,
                powers: {
                    focus: {
                        cost: 300,
                        description: "Révèle le genre du film ou le type d'acteur",
                        duration: 0,
                        type: "information"
                    },
                    insight: {
                        cost: 600,
                        description: "Révèle une connexion majeure (film culte ou rôle important)",
                        duration: 0,
                        type: "hint"
                    },
                    revelation: {
                        cost: 900,
                        description: "Révèle une lettre de votre choix dans le mot à deviner",
                        duration: 0,
                        type: "custom"
                    }
                }
            }
        };
        res.json(config);
    } catch (error) {
        console.error('Erreur lors de la récupération de la configuration des niveaux:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = {
    startNewGame,
    saveProgress,
    getWikiInfo,
    getLeaderboard,
    getLevelConfig
}; 