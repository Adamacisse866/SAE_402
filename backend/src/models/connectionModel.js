const db = require('../config/database');

class Connection {
    static async getConnections(id) {
        // Vérifier si l'ID est un film ou un acteur
        const [movie] = await db.query('SELECT id FROM movies WHERE id = ?', [id]);
        const [actor] = await db.query('SELECT id FROM actors WHERE id = ?', [id]);

        if (movie.length > 0) {
            // Si c'est un film, récupérer les acteurs
            const [actors] = await db.query(`
                SELECT a.* 
                FROM actors a
                JOIN MoviesActors ma ON a.id = ma.id_actor
                WHERE ma.id_movie = ?
            `, [id]);
            return {
                type: 'movie',
                connections: actors
            };
        } else if (actor.length > 0) {
            // Si c'est un acteur, récupérer les films
            const [movies] = await db.query(`
                SELECT m.* 
                FROM movies m
                JOIN MoviesActors ma ON m.id = ma.id_movie
                WHERE ma.id_actor = ?
            `, [id]);
            return {
                type: 'actor',
                connections: movies
            };
        }
        return null;
    }

    static async search(query) {
        const [movies] = await db.query(`
            SELECT 'movie' as type, id, title as name, year
            FROM movies
            WHERE title LIKE ?
            LIMIT 10
        `, [`%${query}%`]);

        const [actors] = await db.query(`
            SELECT 'actor' as type, id, name, NULL as year
            FROM actors
            WHERE name LIKE ?
            LIMIT 10
        `, [`%${query}%`]);

        return [...movies, ...actors];
    }

    static async getGlobalStats() {
        const [stats] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM movies) as totalMovies,
                (SELECT COUNT(*) FROM actors) as totalActors,
                (SELECT COUNT(*) FROM genres) as totalGenres,
                (SELECT COUNT(*) FROM MoviesActors) as totalConnections,
                (SELECT AVG(actor_count) FROM (
                    SELECT id_movie, COUNT(*) as actor_count
                    FROM MoviesActors
                    GROUP BY id_movie
                ) as movie_counts) as avgActorsPerMovie,
                (SELECT AVG(movie_count) FROM (
                    SELECT id_actor, COUNT(*) as movie_count
                    FROM MoviesActors
                    GROUP BY id_actor
                ) as actor_counts) as avgMoviesPerActor
        `);
        return stats[0];
    }
}

module.exports = Connection; 