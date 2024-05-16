const express = require('express');
const validate = require('../../middlewares/validate');
const customerValidation = require('../../validations/store/customer.validation');
const customerController = require('../../controllers/store/customer.controller');
const auth = require('../../middlewares/auth');
const authenticateToken = require('../../middlewares/customerAuth');


const router = express.Router();


router.patch('/update-profile', authenticateToken, customerController.updateProfile); 

router.get("/",authenticateToken, customerController.getDetails)

router
.route("/address")
.post(authenticateToken,customerController.addAddress)
.get(authenticateToken,customerController.getAllAddress)



router
.route("/address/:address_Id")
.delete(authenticateToken,customerController.deleteCustomerAddress)
.patch( authenticateToken, customerController.updateCustomerAddress)

router
.route("/wishlist")
.get(authenticateToken,customerController.getWishlist)

router
.route("/wishlist/:product_Id")
.post(authenticateToken,customerController.addProductToWishlist)
.delete(authenticateToken,customerController.removeProductFromWishlist)



router
.route("/favorite-brands")
.get(authenticateToken,customerController.getFavBrand)


router
.route("/favorite-brands/:brand_id")
.post(authenticateToken,customerController.addFavBrand)
.delete(authenticateToken,customerController.deleteFavBrands)



module.exports = router;