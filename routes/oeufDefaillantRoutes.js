const express = require('express');
const router = express.Router();
const OeufDefaillantController = require('../controller/OeufDefaillantController');

router.post('/', OeufDefaillantController.processOeufDefaillant);

module.exports = router;
