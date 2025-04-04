const Connection = require('../models/connectionModel');

exports.getConnections = async (req, res) => {
    try {
        const connections = await Connection.getConnections(req.params.id);
        if (!connections) {
            return res.status(404).json({ message: 'Film ou acteur non trouvé' });
        }
        res.json(connections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.search = async (req, res) => {
    try {
        const results = await Connection.search(req.query.q);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getGlobalStats = async (req, res) => {
    try {
        const stats = await Connection.getGlobalStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 