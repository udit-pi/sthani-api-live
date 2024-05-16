const express = require('express');



const { Filters } = require('../../controllers/store/filter.controller');

const authenticateToken = require('../../middlewares/customerAuth');
const router = express.Router();

// router.get('/getProducts', validate(productValidation.getProducts), productController.getProducts);
// router.get('/:categoryId',getcategoryId);
router.get('/:pagetype/:id', authenticateToken,Filters)

module.exports = router;