// backend/routes/raceRoutes.js
const express = require('express');
const router = express.Router();
const RaceController = require('../controller/RaceController');

router.post('/', RaceController.create);
router.get('/', RaceController.getAll);
router.get('/:id', RaceController.getById);

module.exports = router;