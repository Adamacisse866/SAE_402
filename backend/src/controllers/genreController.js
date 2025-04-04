const Genre = require('../models/genreModel');

exports.getAllGenres = async (req, res) => {
    try {
        const genres = await Genre.getAll();
        res.json(genres);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getGenreById = async (req, res) => {
    try {
        const genre = await Genre.getById(req.params.id);
        if (!genre) {
            return res.status(404).json({ message: 'Genre non trouvé' });
        }
        res.json(genre);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMoviesByGenre = async (req, res) => {
    try {
        const movies = await Genre.getMoviesByGenreId(req.params.id);
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getGenreStats = async (req, res) => {
    try {
        const stats = await Genre.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 