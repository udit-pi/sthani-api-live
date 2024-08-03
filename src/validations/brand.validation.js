const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createBrand = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    // slug: Joi.string().required(),
    description: Joi.string().required(),
    logo: Joi.string().optional(),
  //   images: Joi.array().items(
  //     Joi.object({
  //         label: Joi.string(),
  //         value: Joi.string()
  //     })
  // ),
   website: Joi.string().uri().allow(''),
  sort_order: Joi.number(),
  color: Joi.string().regex(/^#([0-9A-F]{3}){1,2}$/i).optional()
  }),
};


const getBrands = {
  query: Joi.object().keys({
    name: Joi.string(),
    description: Joi.string(),
    // logo: Joi.string().required(),
    images: Joi.array().items(
      Joi.object({
          label: Joi.string(),
          value: Joi.string()
      })
  ),
  website: Joi.string().allow(' ').optional(),
    // sortBy: Joi.string(),
    // limit: Joi.number().integer(),
    // page: Joi.number().integer(),
  }),
};

const getBrand = {
  params: Joi.object().keys({
    brandId: Joi.string().custom(objectId),
  }),
};

const updateBrand = {
  params: Joi.object().keys({
    brandId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      description: Joi.string(),
    //   images: Joi.array().items(
    //     Joi.object({
    //         label: Joi.string(),
    //         value: Joi.string()
    //     })
    // ),
    website: Joi.string().allow(''),
    color: Joi.string().regex(/^#([0-9A-F]{3}){1,2}$/i).optional(),
    trending_products: Joi.array().items(Joi.string().custom(objectId)).optional(),
    })
    .min(1),
};

const deleteBrand = {
  params: Joi.object().keys({
      brandId: Joi.string().custom(objectId),
  }),
};



module.exports = {
  createBrand,
  getBrands,
  getBrand,
  updateBrand,
  deleteBrand
}


