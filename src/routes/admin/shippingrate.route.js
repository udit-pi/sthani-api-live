const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const router = express.Router();
const shippingRateValidation = require('../../validations/shippingrate.validation');

const shippingRateController = require('../../controllers/shippingrate.controller');

router
  .route('/')
  .post(auth('manageShippingRates'), validate(shippingRateValidation.createShippingRate), shippingRateController.createShippingRate)
  .get(auth('viewShippingRates'), validate(shippingRateValidation.getShippingRates), shippingRateController.getShippingRates);

router
    .route('/:rateId')
    .get(auth('viewShippingRates'), validate(shippingRateValidation.getShippingRate), shippingRateController.getShippingRate)
    .patch(auth('manageShippingRates'), validate(shippingRateValidation.updateShippingRate), shippingRateController.updateShippingRate)
    .delete(auth('manageShippingRates'), validate(shippingRateValidation.deleteShippingRate), shippingRateController.deleteShippingRate);


module.exports = router;
