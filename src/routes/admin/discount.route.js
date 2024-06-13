const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const discountController = require('../../controllers/discount.controller');


const router = express.Router();

router
  .route('/')
  .get(auth('getDiscount'), discountController.getAllDiscount)
  .post(auth('getDiscount'), discountController.saveDiscount)

router
  .route('/:id')
  .get(auth('getDiscount'), discountController.getDiscountById)
  .delete(auth('deleteDiscount'), discountController.deleteDiscountById)
  .patch(auth('editDiscount'), discountController.updateDiscountById)


module.exports = router;
