const express = require('express');
const router = express.Router();
const SituationController = require('../controller/SituationController');

router.post('/', SituationController.create);
router.get('/', SituationController.getAll);
router.get('/lot/:idLot', SituationController.getByLot);

module.exports = router;
