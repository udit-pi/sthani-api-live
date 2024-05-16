
const express = require('express');



const { getBrandsById, getFilterBrands } = require('../../controllers/store/brands.controllers');
const authenticateToken = require('../../middlewares/customerAuth');

const router = express.Router();


// router.get('/:brandsId',getBrandsById);
router.post('/:brandsId',authenticateToken,getFilterBrands)

module.exports = router;