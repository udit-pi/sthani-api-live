const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const orderController = require('../../controllers/order.controller');

const router = express.Router();

router
  .route('/')
  .get(auth('manageOrders'), orderController.getOrders);

router
  .route('/:orderId')
  .get(auth('manageOrders'), orderController.getOrderById);

router
  .route('/:orderId/status')
  .patch(auth('manageOrders'), orderController.updateOrderStatus);

router
  .route('/:orderId/shipment')
  .patch(auth('manageOrders'), orderController.addShipmentDetails);

router
  .route('/:orderId')
  .delete(auth('deleteOrders'), orderController.deleteOrder);

router
  .route('/:orderId/createIQOrder')
  .post(auth('fulfillOrder'), orderController.createIQOrder);

module.exports = router;
