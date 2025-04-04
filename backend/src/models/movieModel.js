const db = require('../config/database');

class Movie {
    static async getAll() {
        const [rows] = await db.query('SELECT * FROM movies');
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.query('SELECT * FROM movies WHERE id = ?', [id]);
        return rows[0];
    }

    static async getRandom() {
        const [rows] = await db.query('SELECT * FROM movies ORDER BY RAND() LIMIT 1');
        return rows[0];
    }

    static async getActorsByMovieId(movieId) {
        const [rows] = await db.query(`
            SELECT a.* 
            FROM actors a
            JOIN MoviesActors ma ON a.id = ma.id_actor
            WHERE ma.id_movie = ?
        `, [movieId]);
        return rows;
    }

    static async getStats() {
        const [rows] = await db.query(`
            SELECT 
                COUNT(*) as totalMovies,
                AVG(actor_count) as avgActorsPerMovie
            FROM movies m
            LEFT JOIN (
                SELECT id_movie, COUNT(*) as actor_count
                FROM MoviesActors
                GROUP BY id_movie
            ) movie_counts ON m.id = movie_counts.id_movie
        `);
        return rows[0];
    }
}

module.exports = Movie; 