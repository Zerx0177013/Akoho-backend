const express = require('express');
const router = express.Router();
const SituationFinanciereController = require('../controller/SituationFinanciereController');

router.get('/', SituationFinanciereController.getByDate);

module.exports = router;
