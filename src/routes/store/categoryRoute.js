const express = require('express');



const { getFiltercategory, getcategoryId } = require('../../controllers/store/category.controller');


const router = express.Router();

// router.get('/getProducts', validate(productValidation.getProducts), productController.getProducts);
// router.get('/:categoryId',getcategoryId);
router.post('/:categoryId',getFiltercategory)

module.exports = router;