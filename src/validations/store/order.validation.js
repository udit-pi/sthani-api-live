const Joi = require('joi');

const createOrder = {
  body: Joi.object().keys({
    items: Joi.array()
      .items(
        Joi.object({
          Product_id: Joi.string().required(),
          quantity: Joi.number().integer().min(1).required(),
          price: Joi.number().required(),
          discounted_price: Joi.number().optional(),
          variant: Joi.object().optional(),
        })
      )
      .required(),
    discountCode: Joi.string().optional(),
    discountAmount: Joi.number().optional(),
    shippingAmount: Joi.number().required(),
    address: Joi.object({
      name: Joi.string().required(),
      mobile: Joi.string().required(),
      address_line: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postal_code: Joi.string().required(),
      landmark: Joi.string().optional(),
      address_type: Joi.string().valid('Home', 'Office').required(),
    }).required(),
  }),
};

const verifyOrder = {
  body: Joi.object().keys({
    items: Joi.array()
      .items(
        Joi.object({
          product: Joi.string().required(),
          quantity: Joi.number().integer().min(1).required(),
        })
      )
      .required(),
    subtotal: Joi.number().required(),
    discountCode: Joi.string().optional(),
    shipping: Joi.number().required(),
  }),
};


const updatePaymentStatus = {
  body: Joi.object().keys({
    orderId: Joi.string().required(),  // Ensure the orderId is a string and required
    status: Joi.string().valid('Pending', 'Paid', 'Failed').required(),  // Validate allowed status values
    transactionId: Joi.string().allow('', null),  // Transaction ID can be optional
    errorMessage: Joi.string().allow('', null),  // Error message can be optional
    paymentMethod: Joi.string().allow('', null),  // Payment method can be optional
    paymentDetails: Joi.object({
      cardType: Joi.string().allow('', null),  // Type of card used, optional
      cardLastFour: Joi.string().length(4).allow('', null),  // Last four digits of the card, length must be exactly 4
      expirationDate: Joi.string().allow('', null)  // Expiration date, no format enforced
    }).allow(null),
    transactionStatus: Joi.string().allow('', null),  // Transaction status, optional
    paymentErrors: Joi.object({
      code: Joi.string().allow('', null),  // Error code, optional
      message: Joi.string().allow('', null)  // Detailed error message, optional
    }).allow(null)
  })
};

module.exports = {
  createOrder,
  verifyOrder,
  updatePaymentStatus
};
