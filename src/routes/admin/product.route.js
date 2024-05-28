const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const productValidation = require('../../validations/product.validation');
const productController = require('../../controllers/product.controller');
const router = express.Router();



router
  .route('/')
  .post(auth('manageProducts'), validate(productValidation.createProduct), productController.createProduct)
  .get(auth('getProducts'), productController.getProducts);
router
  .route('/:productId')
  .get(auth('getProduct'), validate(productValidation.getProduct), productController.getProduct)
  .patch(auth('manageProducts'),productController.updateProduct)
  .delete(auth('manageProducts'), validate(productValidation.deleteProduct), productController.deleteProduct);

module.exports = router;
