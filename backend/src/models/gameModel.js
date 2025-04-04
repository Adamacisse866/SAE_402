const db = require('../config/database');
const wikipedia = require('wikipedia');

class Game {
    static async startNewGame() {
        // Choisir aléatoirement entre un film et un acteur
        const isMovie = Math.random() > 0.5;

        if (isMovie) {
            const [movie] = await db.query('SELECT * FROM movies ORDER BY RAND() LIMIT 1');
            return {
                type: 'movie',
                data: movie[0]
            };
        } else {
            const [actor] = await db.query('SELECT * FROM actors ORDER BY RAND() LIMIT 1');
            return {
                type: 'actor',
                data: actor[0]
            };
        }
    }

    static async saveProgress(progressData) {
        try {
            const { currentMovie, discoveredActors, score, timeSpent } = progressData;
            
            // Calculer le bonus
            const bonus = this.calculateBonus(discoveredActors.length, timeSpent);
            const totalScore = score + bonus;

            // Sauvegarder la progression dans la base de données
            await db.query(
                'INSERT INTO game_progress (current_movie, discovered_actors, score, time_spent, bonus, total_score) VALUES (?, ?, ?, ?, ?, ?)',
                [currentMovie, JSON.stringify(discoveredActors), score, timeSpent, bonus, totalScore]
            );

            return {
                message: 'Progression sauvegardée',
                bonus,
                totalScore
            };
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la progression:', error);
            throw error;
        }
    }

    static calculateBonus(discoveredActorsCount, timeSpent) {
        let bonus = 0;
        
        // Bonus pour le nombre d'acteurs découverts
        if (discoveredActorsCount >= 5) bonus += 50;
        else if (discoveredActorsCount >= 3) bonus += 30;
        else if (discoveredActorsCount >= 1) bonus += 10;

        // Bonus pour la rapidité
        if (timeSpent < 30) bonus += 20;
        else if (timeSpent < 60) bonus += 10;

        return bonus;
    }

    static async getHint(movieId) {
        try {
            // Récupérer un acteur aléatoire associé au film
            const [actors] = await db.query(`
                SELECT a.*, COUNT(ma2.id_movie) as connection_count
                FROM actors a
                JOIN MoviesActors ma ON a.id = ma.id_actor
                LEFT JOIN MoviesActors ma2 ON a.id = ma2.id_actor
                WHERE ma.id_movie = ?
                GROUP BY a.id
                ORDER BY connection_count DESC
                LIMIT 1
            `, [movieId]);

            if (actors.length === 0) {
                return null;
            }

            return {
                name: actors[0].name,
                connection_count: actors[0].connection_count
            };
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'indice:', error);
            throw error;
        }
    }

    static async getWikiInfo(id, type) {
        try {
            let searchQuery;
            
            // Récupérer le titre du film ou le nom de l'acteur depuis la base de données
            if (type === 'movie') {
                const [result] = await db.query('SELECT title FROM movies WHERE id = ?', [id]);
                if (!result || result.length === 0) return null;
                searchQuery = result[0].title + ' film';
            } else {
                const [result] = await db.query('SELECT name FROM actors WHERE id = ?', [id]);
                if (!result || result.length === 0) return null;
                searchQuery = result[0].name + ' actor';
            }

            // Rechercher sur Wikipedia
            const searchResults = await wikipedia.search(searchQuery);
            if (!searchResults.results || searchResults.results.length === 0) {
                return null;
            }

            // Récupérer les détails de la page
            const page = await wikipedia.page(searchResults.results[0].title);
            const summary = await page.summary();
            const images = await page.images();

            // Trouver l'image principale
            let mainImage;
            if (type === 'movie') {
                mainImage = images.find(img => 
                    img.url.toLowerCase().includes('poster') || 
                    img.url.toLowerCase().includes('cover') || 
                    img.url.toLowerCase().includes('film')
                );
            } else {
                mainImage = images.find(img => 
                    !img.url.toLowerCase().includes('logo') && 
                    !img.url.toLowerCase().includes('icon') &&
                    (img.url.toLowerCase().includes('actor') || 
                     img.url.toLowerCase().includes('portrait'))
                );
            }

            // Si aucune image spécifique n'est trouvée, prendre la première image
            if (!mainImage && images.length > 0) {
                mainImage = images[0];
            }

            return {
                title: page.title,
                extract: summary.extract,
                imageUrl: mainImage ? mainImage.url : null,
                fullUrl: page.fullurl
            };
        } catch (error) {
            console.error('Erreur Wikipedia:', error);
            return null;
        }
    }

    static async getLeaderboard() {
        try {
            const [results] = await db.query(
                'SELECT player_name, total_score FROM game_progress ORDER BY total_score DESC LIMIT 10'
            );
            return results;
        } catch (error) {
            console.error('Erreur lors de la récupération du classement:', error);
            return [];
        }
    }
}

module.exports = Game; 