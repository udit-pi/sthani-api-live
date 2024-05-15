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

module.exports = router;

