const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const discountController = require('../../controllers/discount.controller');


const router = express.Router();

router
  .route('/')
  .get(auth('getDiscount'),discountController.getAllDiscount)
  .post(auth('getDiscount'),discountController.saveDiscount)

  router
  .route('/:id')
 .get(auth('getDiscountById'),discountController.getDiscountById)
.delete(auth('deleteDiscountById'),discountController.deleteDiscountById)
.patch(auth('deleteDiscountById'),discountController.updateDiscountById)


module.exports = router;
