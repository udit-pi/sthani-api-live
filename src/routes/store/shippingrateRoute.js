const express = require('express');

const { calculateShippingRate } = require('../../controllers/store/shippingrate.controller');
const authenticateToken = require('../../middlewares/customerAuth');

const router = express.Router();



router.post('/calculate', authenticateToken, calculateShippingRate)

module.exports = router;