const express = require('express');
const auth = require('../../middlewares/auth');
const router = express.Router();
const inventoryController = require('../../controllers/inventory.controller');


router.get('/products', auth('manageStock'), inventoryController.getAllProducts);
router.post('/update-stock', auth('manageStock'), inventoryController.updateStock);
router.post('/bulk-update-stock', auth('manageStock'), inventoryController.bulkUpdateStock);

module.exports = router;