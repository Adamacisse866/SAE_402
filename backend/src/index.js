const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./src/swagger.yaml');

const movieRoutes = require('./routes/movieRoutes');
const actorRoutes = require('./routes/actorRoutes');
const gameRoutes = require('./routes/gameRoutes');
const connectionRoutes = require('./routes/connectionRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/movies', movieRoutes);
app.use('/api/actors', actorRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/connections', connectionRoutes);

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Ne démarrer le serveur que si le fichier est exécuté directement
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur le port ${PORT}`);
        console.log(`Documentation Swagger disponible sur http://localhost:${PORT}/api-docs`);
    });
}

module.exports = app; 