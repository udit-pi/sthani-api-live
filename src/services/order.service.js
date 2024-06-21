const { Order, Product, Discount, Customer, ShippingRate } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const MEDIA_URL = process.env.MEDIA_URL;

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
  const { items, discountAmount=0, discountCode="", shippingAmount=0, address } = orderData;
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
    let variantDetails = {};

    if (item.variant && item.variant.variant_id) {
      const variant = product.product_variants.find(v => v._id.toString() === item.variant.variant_id);
      if (!variant) {
        throw new ApiError(httpStatus.NOT_FOUND, `Variant not found: ${item.variant.variant_id}`);
      }

      priceToUse = item.variant.discounted_price || variant.price;
      variantDetails = {  // Collect variant details for the order item
        variant_id: variant._id,
        name: variant.name,
        price: variant.price,
        discounted_price: variant.discounted_price,
        sku: variant.sku,
        image: variant.image && `${variant.image}`
      };

      if (variant.stock < item.quantity) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Insufficient stock for variant: ${variant.name}`);
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
      image: product.media && product.media[0] ? `${product.media[0]}` : "",
      quantity: item.quantity,
      price: priceToUse,
      discounted_price: item.discounted_price || priceToUse,
      total: item.quantity * priceToUse
    };

    // Add variant only if it has meaningful data
    if (item.variant && item.variant.variant_id && item.variant.sku !="") {
      orderItem.variant = variantDetails;
    }

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

    
    return order;

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

  createOrder,
  queryOrders,
  getOrderById,
  updateOrderStatus,
  addShipmentDetails,
  updatePaymentStatus
};
