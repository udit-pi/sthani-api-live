const { Order, Product, Discount, Customer, ShippingRate } = require('../models');
const ApiError = require('../utils/ApiError');
const axios = require('axios');
const httpStatus = require('http-status');
const MEDIA_URL = process.env.MEDIA_URL;
const mapOrderStatus = require('../utils/mapOrderStatus');
const { formatDateUAE } = require('../utils/dateUtils')
const { sendOrderCreatedEmail, sendOrderStatusUpdatedEmail, sendPaymentStatusUpdatedEmail } = require('../utils/emailService');
const OrderSequence = require('../models/OrderSequence.model');


// const verifyOrder = async (items, discountAmount, shipping) => {

//   const productUpdates = [];


//   for (const item of items) {
//     const product = await Product.findById(item.product);
//     if (!product) {
//       throw new ApiError(httpStatus.NOT_FOUND, `Product not found: ${item.product}`);
//     }

//     // Check stock for the variant if provided
//     if (item.variant && item.variant._id) {
//       const variant = product.product_variants.id(item.variant._id);
//       if (!variant) {
//         throw new ApiError(httpStatus.NOT_FOUND, `Variant not found: ${item.variant._id}`);
//       }
//       if (variant.stock < item.quantity) {
//         throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock for variant: ${variant.name}`);
//       }
//       productUpdates.push({ product, variant, quantity: item.quantity });
//     } else {
//       if (product.stock < item.quantity) {
//         throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock for product: ${product.name}`);
//       }
//       productUpdates.push({ product, quantity: item.quantity });
//     }

//     const itemPrice = item.discounted_price || item.price;
//     total += item.quantity * itemPrice;
//   }

//   // Calculate subtotal and total amount
//   subtotal = total;
//   total = subtotal - discount;

//   return { subtotal, discount, productUpdates };
// };

const createOrder = async (customer, orderData) => {
  const { items, discountAmount = 0, discountCode = "", shippingAmount = 0, address } = orderData;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Items are required and should be a non-empty array.');
  }

  if (!address) {
    throw new Error('Address is required.');
  }


  let subtotal = 0;
  let currency = "AED";  // Assuming currency is fixed for all orders; if not, this might need to be dynamic
  const productUpdates = [];
  const orderItems = [];

  // Fetch customer details
  const customerDetails = await Customer.findById(customer._id);
  if (!customerDetails) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  for (const item of items) {
    const product = await Product.findById(item.Product_id);
    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, `Product not found: ${item.Product_id}`);
    }

    let priceToUse;
    let imageToUse = product.media && product.media[0] ? `${product.media[0]}` : "";
    let variantDetails = {};

    if (item.variant && item.variant.variant_id) {
      const variant = product.product_variants.find(v => v._id.toString() === item.variant.variant_id);
      if (!variant) {
        throw new ApiError(httpStatus.NOT_FOUND, `Variant not found: ${item.variant.variant_id}`);
      }

      priceToUse = item.variant.discounted_price || variant.price;
      if (variant.image) imageToUse = `${variant.image}`;
      variantDetails = {  // Collect variant details for the order item
        variant_id: variant._id,
        name: variant.name,
        // price: variant.price,
        // discounted_price: variant.discounted_price,
        sku: variant.sku,
        // image: variant.image && `${variant.image}`
      };

      if (variant.stock < item.quantity) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock: ${product.name} - ${variant.name}`);
      }
      productUpdates.push({ product: product._id, variant: variant._id, quantity: item.quantity });
    } else {
      priceToUse = item.discounted_price || product.price;

      if (product.stock < item.quantity) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock for product: ${product.name}`);
      }
      productUpdates.push({ product: product._id, quantity: item.quantity });
    }

    subtotal += priceToUse * item.quantity;


    // Construct the order item object, conditionally including the variant
    let orderItem = {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      image: imageToUse ? imageToUse : "",
      quantity: item.quantity,
      price: priceToUse,
      //discounted_price: item.discounted_price || priceToUse,
      total: item.quantity * priceToUse
    };

    // Add variant only if it has meaningful data
    if (item.variant && item.variant.variant_id && item.variant.sku != "") {
      orderItem.variant = variantDetails;
    }
    // console.log(imageToUse);
    orderItems.push(orderItem);

    delete variantDetails;

  }

  const total = subtotal - discountAmount + shippingAmount;

  // Create the order object
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
      amount: discountAmount,
    },
    shipping: shippingAmount,
    total,
  });

  try {
     

    // Ensure order_no is set before saving
    if (!order.order_no) {
      // Generate the order number
      const sequence = await OrderSequence.findOneAndUpdate(
        {},
        { $inc: { current: 1 } },
        { new: true, upsert: true }
      );

      const orderNo = sequence.current + 10000000;
      order.order_no = orderNo.toString();
    }

    
    
    await order.save();

    // Decrement stock after order is successfully saved
    for (const update of productUpdates) {
      if (update.variant) {
        await Product.updateOne(
          { _id: update.product, 'product_variants._id': update.variant },
          { $inc: { 'product_variants.$.stock': -update.quantity } }
        );
      } else {
        await Product.updateOne(
          { _id: update.product },
          { $inc: { stock: -update.quantity } }
        );
      }
    }

    await sendOrderCreatedEmail(order);

    // Update the order with a new status log entry
    order.statusLogs.push({
      status: 'Order Placed',
      description: `Order successfully placed.`
    });
    await order.save();

    orderDetails = prepOrder(order);

    return orderDetails;

  } catch (error) {
    console.error('Failed to save the order:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to save the order');
  }
};






const updatePaymentStatus = async (orderId, status, transactionId, errorMessage) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  order.paymentStatus = status;
  order.transactionId = transactionId;
  order.paymentErrorMessage = errorMessage;

  // Update the order with a new status log entry
  order.statusLogs.push({
    status: `New Payment Status: ${status}` ,
    description: errorMessage && `Error ${errorMessage}` + transactionId && `TransactionId: ${transactionId}`
  });
  

  await order.save();
  await sendPaymentStatusUpdatedEmail(order);

  orderDetails = prepOrder(order);

  return orderDetails;
};


const queryOrders = async (filter, options) => {
  const orders = await Order.find(filter, options);
  return orders;
};

const getOrderById = async (id) => {
  // Fetch the order by its ID
  const order = await Order.findById(id);

  // Throw an error if the order is not found
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  orderDetails = prepOrder(order);

  return orderDetails;
};

const updateOrderStatus = async (id, status) => {
  const order = await Order.findByIdAndUpdate(id, { orderStatus: status }, { new: true });
  orderDetails = prepOrder(order);

  await sendOrderStatusUpdatedEmail(order);

  return orderDetails;
};

const addShipmentDetails = async (id, shipmentDetails) => {
  const order = await Order.findByIdAndUpdate(id, { shipmentDetails }, { new: true });
  order = prepOrder(order);
  return order;
};

const deleteOrderById = async (id) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new Error('Order not found');
  }
  await order.remove();
};


function prepOrder(orderData) {
  // Convert Mongoose document to JSON if needed
  if (orderData.toJSON) {
    orderData = orderData.toJSON();
  }

  if (orderData.id) {
    orderData.Order_id = orderData.id.toString(); // Ensure the ID is a string if needed
    delete orderData.id; // Remove the original _id field
  }
  
  orderData.items.forEach(item => {
    if (item.image && !item.image.startsWith(MEDIA_URL)) {
      item.image = `${MEDIA_URL}${item.image}`;
    }
  });

  // Flatten and adjust discount and shipping details
  if (orderData.discount) {
    orderData.discountCode = orderData.discount.code;
    orderData.discountAmount = orderData.discount.amount;
    delete orderData.discount; // Remove the old discount structure
  }

  if (orderData.shipping) {
    orderData.shippingAmount = orderData.shipping;
    delete orderData.shipping; // Remove the old shipping key
  }

  // Include formatted date if applicable
  if (orderData.createdAt && formatDateUAE) {
    orderData.createdAt_formatted = formatDateUAE(orderData.createdAt);
  }

  // Map status if function is available
  if (orderData.orderStatus && mapOrderStatus) {
    orderData.orderStatus = mapOrderStatus(orderData.orderStatus);
  }

  return orderData;
}


const createIQOrder = async (orderId) => {
  const order = await Order.findById(orderId).populate('items.productId'); 
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Construct the payload from the order data
  const payload = {
    client_reference: `${order.order_no}`,
    order_type: "XDOCK",
    total_price: order.total,
    currency: order.currency,
    payment_type: "PREPAID", 
    note: `${order.order_no}`,
    
    consignee: {
      name: order.customer.name,
      surname: order.customer.name,
      phone: order.customer.mobile,
      mobile: order.customer.mobile,
      company: order.customer.name
    },
    skus: order.items.map(item => ({
      code: item.sku, 
      quantity: item.quantity,
      description: item.name, 
      price: item.price,
      supplierId: null, 
      supplierAddress: null 
    })),
    shipping_address: {
      country: "UAE",
      state: order.address.state,
      city: order.address.city,
      address_1: order.address.address_line // Assuming 'address_line' contains the full address
    },
    parcel: {
      total_weight: 1,
      total_volume: 1,
      box_number: 1
    }
  };

  try {

    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${process.env.IQ_FULFILLMENT_TOKEN}`
    };

    const iqResponse = await axios.post(process.env.IQ_FULFILLMENT_CREATE_ORDER_URL, payload, { headers });

    // update main order status
    order.orderStatus = "Confirmed";

    // Update the order with a new status log entry
    order.statusLogs.push({
      status: 'Sent to IQ Fulfillment',
      description: `Order successfully sent to IQ Fulfillment. Response: ${JSON.stringify(iqResponse.data)}`
    });
    await order.save();

    return {
      message: "Order sent to IQ Fulfillment successfully!",
      iqFulfillmentResponse: iqResponse.data
    };
  } catch (error) {
    console.error('Failed to create order in IQ Fulfillment:', error);
    // Log the error in status logs
    order.statusLogs.push({
      status: 'IQ Fulfillment Error',
      description: `Failed to send order to IQ Fulfillment. Error: ${error.message}`
    });
    await order.save();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to create order in IQ Fulfillment: ${error.message}`);
  }
};


module.exports = {

  createOrder,
  queryOrders,
  getOrderById,
  updateOrderStatus,
  addShipmentDetails,
  updatePaymentStatus,
  deleteOrderById,
  createIQOrder
};
