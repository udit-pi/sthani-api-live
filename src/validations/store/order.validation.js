const Joi = require('joi');

const createOrder = {
  body: Joi.object().keys({
    items: Joi.array()
      .items(
        Joi.object({
          product: Joi.string().required(),
          quantity: Joi.number().integer().min(1).required(),
          price: Joi.number().required(),
          discounted_price: Joi.number().optional(),
          variant: Joi.object().optional(),
        })
      )
      .required(),
    discount: Joi.object({
      code: Joi.string().optional(),
      amount: Joi.number().optional(),
    }),
    shipping: Joi.number().required(),
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

module.exports = {
  createOrder,
  verifyOrder,
};
