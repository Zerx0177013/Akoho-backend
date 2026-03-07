const express = require('express');
const router = express.Router();
const EclosionController = require('../controller/EclosionController');

router.post('/', EclosionController.create);

module.exports = router;
