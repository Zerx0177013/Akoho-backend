// backend/routes/situationRoutes.js
const express = require('express');
const router = express.Router();
const SituationController = require('../controller/SituationController');

router.get('/', SituationController.getAll);

module.exports = router;
