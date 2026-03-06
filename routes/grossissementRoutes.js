// backend/routes/grossissementRoutes.js
const express = require('express');
const router = express.Router();
const GrossissementController = require('../controller/GrossissementController');

router.post('/', GrossissementController.create);
router.post('/bulk', GrossissementController.createBulk);
router.get('/', GrossissementController.getAll);
router.get('/race/:idRace', GrossissementController.getByRace);
router.get('/age/:age', GrossissementController.getByAge);
router.get('/race/:idRace/age/:age', GrossissementController.getByRaceAndAge);

module.exports = router;
