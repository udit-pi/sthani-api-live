const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { orderService } = require('../services');

const getOrders = catchAsync(async (req, res) => {
  const orders = await orderService.queryOrders(req.query);
  res.status(httpStatus.OK).json(orders);
});

const getOrderById = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(req.params.orderId);
  res.status(httpStatus.OK).json(order);
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.orderId, req.body.status);
  res.status(httpStatus.OK).json(order);
});

const addShipmentDetails = catchAsync(async (req, res) => {
  const order = await orderService.addShipmentDetails(req.params.orderId, req.body);
  res.status(httpStatus.OK).json(order);
});


const verifyOrder = catchAsync(async (req, res) => {
  const { items, subtotal, discountCode, shipping } = req.body;
  const result = await orderService.verifyOrder(items, subtotal, discountCode, shipping);
  res.status(httpStatus.OK).send(result);
});

const createOrder = catchAsync(async (req, res) => {
  const { customer } = req;
  const orderData = req.body;
  const order = await orderService.createOrder(customer, orderData);
  if (order) {
    return res.status(201).json({ status: 201, message: 'Order created successfully!', order: order });
  } else {
    return res.status(400).json({ status: 400, message: 'Error creating order' });
  }

  //res.status(httpStatus.CREATED).send(order);
});

const updatePaymentStatus = catchAsync(async (req, res) => {
  const { orderId, status, transactionId, errorMessage } = req.body;
  const order = await orderService.updatePaymentStatus(orderId, status, transactionId, errorMessage);
  if (order) {
    return res.status(201).json({ status: 201, message: 'Payment updated successfully!', order: order });
  } else {
    return res.status(400).json({ status: 400, message: 'Error updating payment' });
  }

  res.status(httpStatus.OK).json(order);
});

module.exports = {
  verifyOrder,
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  addShipmentDetails,
};
