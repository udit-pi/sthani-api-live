const express = require('express');
const router = express.Router();
const discountController = require('../../controllers/store/discount.controller');
const authenticateToken = require('../../middlewares/customerAuth');

router.post('/validate', authenticateToken, discountController.validateDiscountCode);
router.post('/markUsed', authenticateToken, discountController.markDiscountCodeUsed);

module.exports = router;