// shippingRate.validation.js

const Joi = require('joi');

const createShippingRate = {
  body: Joi.object().keys({
    minValue: Joi.number().required(),
    maxValue: Joi.number().required(),
    rate: Joi.number().required()
  })
};

const getShippingRates = {
  query: Joi.object().keys({
    page: Joi.number().integer(),
    pageSize: Joi.number().integer()
  })
};

const getShippingRate = {
  params: Joi.object().keys({
    rateId: Joi.string().required()
  })
};

const updateShippingRate = {
  params: Joi.object().keys({
    rateId: Joi.string().required()
  }),
  body: Joi.object().keys({
    minValue: Joi.number(),
    maxValue: Joi.number(),
    rate: Joi.number()
  })
};

const deleteShippingRate = {
  params: Joi.object().keys({
    rateId: Joi.string().required()
  })
};

module.exports = {
  createShippingRate,
  getShippingRates,
  getShippingRate,
  updateShippingRate,
  deleteShippingRate
};
