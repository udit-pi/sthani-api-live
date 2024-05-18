const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const productValidation = require('../../validations/product.validation');
const productController = require('../../controllers/store/product.controller')
const authenticateToken = require('../../middlewares/customerAuth');

const router = express.Router();

router.get('/getProducts', productController.getProducts);


router.get('/:productId', productController.getProduct)
  
module.exports = router;