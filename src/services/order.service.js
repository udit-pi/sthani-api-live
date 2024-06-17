const { Order, Product, Discount, Customer, ShippingRate } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');


const getShippingRate = async (subtotal) => {
  // Replace this with your actual logic to fetch the shipping rate based on subtotal
  const shippingRate = await ShippingRate.findOne({ minValue: { $lte: subtotal }, maxValue: { $gte: subtotal } });
  return shippingRate ? shippingRate.rate : 0;
};


const verifyOrder = async (items, subtotal, discountCode) => {
  let total = 0;
  const productUpdates = [];
  let discount = 0;

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, `Product not found: ${item.product}`);
    }

    // Check stock for the variant if provided
    if (item.variant && item.variant._id) {
      const variant = product.product_variants.id(item.variant._id);
      if (!variant) {
        throw new ApiError(httpStatus.NOT_FOUND, `Variant not found: ${item.variant._id}`);
      }
      if (variant.stock < item.quantity) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock for variant: ${variant.name}`);
      }
      productUpdates.push({ product, variant, quantity: item.quantity });
    } else {
      if (product.stock < item.quantity) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock for product: ${product.name}`);
      }
      productUpdates.push({ product, quantity: item.quantity });
    }

    const itemPrice = item.discounted_price || item.price;
    total += item.quantity * itemPrice;
  }

  // Validate discount code
  if (discountCode) {
    const discountData = await Discount.findOne({ code: discountCode });
    if (!discountData) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Discount code not found');
    }
    if (discountData.discountValueType === 'PERCENTAGE') {
      discount = (discountData.discountValue / 100) * total;
    } else {
      discount = discountData.discountValue;
    }
  }

  // Calculate subtotal and total amount
  subtotal = total;
  total = subtotal - discount;

  return { subtotal, discount, productUpdates };
};


const createOrder = async (customer, orderData) => {
  const { items, discountCode, address, currency = 'AED' } = orderData;
  let total = 0;

  // Fetch customer details
  const customerDetails = await Customer.findById(customer._id);
  if (!customerDetails) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  // Validate the order first
  const { subtotal, discount, productUpdates } = await verifyOrder(items, orderData.subtotal, discountCode);

  // Calculate shipping
  const shipping = await getShippingRate(subtotal);

  // Calculate total amount
  total = subtotal - discount + shipping;

  // Update stock only after validation
  for (const update of productUpdates) {
    if (update.variant) {
      update.variant.stock -= update.quantity;
    } else {
      update.product.stock -= update.quantity;
    }
    await update.product.save();
  }

  // Create order items
  const orderItems = items.map((item) => {
    const product = productUpdates.find((p) => p.product._id.toString() === item.product);
    const itemPrice = item.discounted_price || item.price;
    return {
      productId: product.product._id,
      name: product.product.name,
      sku: product.product.sku,
      image: product.product.media && product.product.media[0] ? product.product.media[0] : "",
      quantity: item.quantity,
      price: item.price,
      discounted_price: item.discounted_price || item.price,
      total: item.quantity * itemPrice,
      variant: item.variant || {},
    };
  });

  // Create order
  const order = new Order({
    customer: {
      customerId: customerDetails._id,
      name: `${customerDetails.first_name} ${customerDetails.last_name}`,
      email: customerDetails.email,
      mobile: customerDetails.mobile,
    },
    address,
    items: orderItems,
    currency,
    subtotal,
    discount: {
      code: discountCode,
      amount: discount,
    },
    shipping,
    total,
  });

  await order.save();
  return order;
};

const updatePaymentStatus = async (orderId, status, transactionId, errorMessage) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  order.paymentStatus = status;
  order.transactionId = transactionId; // Assuming you want to store this.
  order.paymentErrorMessage = errorMessage; // Optional: Store any error message.

  await order.save();

  return order;
};


const queryOrders = async (filter, options) => {
  const orders = await Order.find(filter, options);
  return orders;
};

const getOrderById = async (id) => {
  const order = await Order.findById(id);
  return order;
};

const updateOrderStatus = async (id, status) => {
  const order = await Order.findByIdAndUpdate(id, { orderStatus: status }, { new: true });
  return order;
};

const addShipmentDetails = async (id, shipmentDetails) => {
  const order = await Order.findByIdAndUpdate(id, { shipmentDetails }, { new: true });
  return order;
};

module.exports = {
  verifyOrder,
  createOrder,
  queryOrders,
  getOrderById,
  updateOrderStatus,
  addShipmentDetails,
  updatePaymentStatus
};
