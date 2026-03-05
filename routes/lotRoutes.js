// backend/routes/lotRoutes.js
const express = require('express');
const router = express.Router();
const LotController = require('../controller/LotController');

router.post('/', LotController.create);
router.get('/', LotController.getAll);
router.get('/race/:idRace', LotController.getByRace);
router.get('/:id', LotController.getById);

module.exports = router;
