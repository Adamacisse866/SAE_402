const Actor = require('../models/actorModel');

exports.getAllActors = async (req, res) => {
    try {
        const actors = await Actor.getAll();
        res.json(actors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getActorById = async (req, res) => {
    try {
        const actor = await Actor.getById(req.params.id);
        if (!actor) {
            return res.status(404).json({ message: 'Acteur non trouvé' });
        }
        res.json(actor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRandomActor = async (req, res) => {
    try {
        const actor = await Actor.getRandom();
        res.json(actor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMoviesByActor = async (req, res) => {
    try {
        const movies = await Actor.getMoviesByActorId(req.params.id);
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getActorStats = async (req, res) => {
    try {
        const stats = await Actor.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 