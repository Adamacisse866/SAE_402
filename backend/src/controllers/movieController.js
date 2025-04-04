const Movie = require('../models/movieModel');

const movieController = {
    getAllMovies: async (req, res) => {
        try {
            const movies = await Movie.getAll();
            res.json(movies);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getMovieById: async (req, res) => {
        try {
            const movie = await Movie.getById(req.params.id);
            if (!movie) {
                return res.status(404).json({ message: 'Film non trouvé' });
            }
            res.json(movie);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getRandomMovie: async (req, res) => {
        try {
            const movie = await Movie.getRandom();
            res.json(movie);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getMovieStats: async (req, res) => {
        try {
            const stats = await Movie.getStats();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getMovieActors: async (req, res) => {
        try {
            const actors = await Movie.getActorsByMovieId(req.params.id);
            res.json(actors);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = movieController; 