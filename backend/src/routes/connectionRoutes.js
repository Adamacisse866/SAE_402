const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');

router.get('/search', connectionController.search);
router.get('/stats', connectionController.getGlobalStats);
router.get('/:id', connectionController.getConnections);

module.exports = router; 