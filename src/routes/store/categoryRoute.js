const express = require('express');



const { getFiltercategory, getcategoryId } = require('../../controllers/store/category.controller');

const authenticateToken = require('../../middlewares/customerAuth');
const router = express.Router();

// router.get('/getProducts', validate(productValidation.getProducts), productController.getProducts);
// router.get('/:categoryId',getcategoryId);
router.post('/:categoryId',authenticateToken,getFiltercategory)

module.exports = router;