const db = require('../config/database');

class Actor {
    static async getAll() {
        const [rows] = await db.query('SELECT * FROM actors');
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.query('SELECT * FROM actors WHERE id = ?', [id]);
        return rows[0];
    }

    static async getRandom() {
        const [rows] = await db.query('SELECT * FROM actors ORDER BY RAND() LIMIT 1');
        return rows[0];
    }

    static async getMoviesByActorId(actorId) {
        const [rows] = await db.query(`
            SELECT m.* 
            FROM movies m
            JOIN MoviesActors ma ON m.id = ma.id_movie
            WHERE ma.id_actor = ?
        `, [actorId]);
        return rows;
    }

    static async getStats() {
        const [rows] = await db.query(`
            SELECT 
                COUNT(DISTINCT a.id) as totalActors,
                COUNT(DISTINCT ma.id_movie) as totalMoviesWithActors,
                AVG(actor_count) as avgActorsPerMovie
            FROM actors a
            LEFT JOIN MoviesActors ma ON a.id = ma.id_actor
            LEFT JOIN (
                SELECT id_movie, COUNT(*) as actor_count
                FROM MoviesActors
                GROUP BY id_movie
            ) movie_counts ON ma.id_movie = movie_counts.id_movie
        `);
        return rows[0];
    }
}

module.exports = Actor; 