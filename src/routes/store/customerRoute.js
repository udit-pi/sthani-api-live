const express = require('express');
const validate = require('../../middlewares/validate');
const customerValidation = require('../../validations/store/customer.validation');
const customerController = require('../../controllers/store/customer.controller');
const auth = require('../../middlewares/auth');
const authenticateToken = require('../../middlewares/customerAuth');


const router = express.Router();


router.patch('/update-profile', authenticateToken, customerController.updateProfile); 

router.get("/", customerController.getDetails)

router
.route("/address")
.post(customerController.addAddress)
.get(customerController.getAllAddress)



router
.route("/address/:address_Id")
.delete(customerController.deleteCustomerAddress)
.patch(customerController.updateCustomerAddress)

module.exports = router;

