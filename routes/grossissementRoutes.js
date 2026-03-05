// backend/routes/grossissementRoutes.js
const express = require('express');
const router = express.Router();
const GrossissementController = require('../controller/GrossissementController');

router.get('/', GrossissementController.getAll);

module.exports = router;
