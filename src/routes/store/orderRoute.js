const express = require('express');
const authenticateToken = require('../../middlewares/customerAuth');
const validate = require('../../middlewares/validate');
const orderValidation = require('../../validations/store/order.validation');
const orderController = require('../../controllers/order.controller');

const router = express.Router();

router
  .route('/verify')
  .post(authenticateToken, validate(orderValidation.verifyOrder), orderController.verifyOrder);

router
  .route('/')
  .post(authenticateToken, validate(orderValidation.createOrder), orderController.createOrder);

router
  .route('/update-payment-status')
  .patch(authenticateToken, validate(orderValidation.updatePaymentStatus), orderController.updatePaymentStatus);

module.exports = router;
