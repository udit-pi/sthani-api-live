const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createHome = {
  body: Joi.object().keys({
    placement_id: Joi.string().required(),
    title: Joi.string().required(),
    subtitle: Joi.string().allow(''),
    widget_type: Joi.string().required(),
    items: Joi.array().items(
            Joi.object({
               image:  Joi.string().allow(''),
               description: Joi.string().allow(''),
               tag: Joi.string().allow(''),
               brand: Joi.string().allow(''),
               destination: Joi.string().allow(''),
               id: Joi.string().custom(objectId),
               slideShowBrand: Joi.string().custom(objectId),
               category: Joi.string().custom(objectId),
               product: Joi.string().custom(objectId),
               products: Joi.array().items(
                Joi.object({
                  label: Joi.string(),
                  value: Joi.string(),
                  _id: Joi.string().allow('')
                })
              ).allow(''),
            })
            .optional(),
              
        ),
  }),
  allowUnknown: true
};

const updateHome = {
  body: Joi.object().keys({
    id: Joi.string().custom(objectId),
    placement_id: Joi.string().required(),
    title: Joi.string().required(),
    subtitle: Joi.string().allow(''),
    widget_type: Joi.string().required(),
    items: Joi.array().items(
            Joi.object({
               image:  Joi.string().allow(''),
               description: Joi.string().allow(''),
               tag: Joi.string().allow(''),
               brand: Joi.string().allow(''),
               destination: Joi.string().allow(''),
               id: Joi.string().custom(objectId),
               slideShowBrand: Joi.string().custom(objectId),
               category: Joi.string().custom(objectId),
               product: Joi.string().custom(objectId),
               products: Joi.array().items(
                Joi.object({
                  label: Joi.string(),
                  value: Joi.string(),
                  _id: Joi.string().allow('')
                })
              ).allow(''),
            })
            .optional(),
              
        ),
  }),
  allowUnknown: true
};

const deleteWidget = {
  params: Joi.object().keys({
      widgetId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createHome,
  updateHome,
  deleteWidget
 
}


