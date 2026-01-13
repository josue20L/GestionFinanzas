const express = require('express');
const router = express.Router();

const { consolidar } = require('../controllers/consolidacionController');

// POST /api/consolidacion
router.post('/consolidacion', consolidar);

module.exports = router;
