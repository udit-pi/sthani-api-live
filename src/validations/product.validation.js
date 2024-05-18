const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createProduct = {
  body: Joi.object().keys({
    brand_id: Joi.string().custom(objectId),
    name: Joi.string().required(),
    sku: Joi.string().allow(''),
    // slug: Joi.string().required(),
    description_short: Joi.string().allow(''),
    // logo: Joi.string().required(),
    description: Joi.string().allow(''),
    // meta_title: Joi.string().allow(''),
    // meta_description: Joi.string(),
    // short_description: Joi.string(),
    // meta_keywords: Joi.array(),
    // additional_descriptions: Joi.array().items(
    //   Joi.object({
    //     label: Joi.string(),
    //     value: Joi.string(),
    //   })
    // ),
    // additional_properties: Joi.array().items(
    //   Joi.object({
    //     label: Joi.string(),
    //     value: Joi.string(),
    //   })
    // ),
    weight: Joi.number().required(),
    height: Joi.number().allow(''),
    length: Joi.number().allow(''),
    width: Joi.number().allow(''),
    // quantity_default: Joi.number().default(0),
    quantity_min: Joi.number().default(0),
    // quantity_max: Joi.number(),
    stock: Joi.number().default(0),
    // reviews_rating: Joi.number(),
    // allow_out_of_stock_purchase: Joi.boolean(),
    price: Joi.number().required(),
    discounted_price: Joi.number().allow(''),
    // price_includes_tax: Joi.boolean(),
    cost: Joi.number().allow(''),
    published: Joi.string().allow(''),
    // sales_count: Joi.number().default(0),
    category: Joi.array().items(
      Joi.object({
        label: Joi.string(),
        value: Joi.string(),
      })
    ),
    
    productVariants: Joi.array().items(
      Joi.object({
        image: Joi.any().optional().allow(null),
        variantName: Joi.string().allow(''),
        variantPrice: Joi.number().required(),
        variantDiscountedPrice: Joi.number().optional().allow(null),
        variantStock: Joi.number().required(),
        
      })    
    ),
    additional_descriptions: Joi.array().items(
      Joi.object({
        label: Joi.string().optional().allow(''),
        value: Joi.string().allow(''),
               
      })    
    ),
    options: Joi.array().items(
      Joi.object({
        optionName: Joi.string().optional().allow(null),
        options: Joi.array().items(
          Joi.object({
            value:  Joi.string().optional().allow(null),
          })
        )
       
        
      })    
    ),
  })
  .options({ allowUnknown: true }),
};

const getProducts = {
  query: Joi.object().keys({
    brand_id: Joi.string().custom(objectId),
    name: Joi.string().required(),
    sku: Joi.string().required(),
    // slug: Joi.string().required(),
    description_short: Joi.string().allow(''),
    // logo: Joi.string().required(),
    description: Joi.string().allow(''),
    // meta_title: Joi.string().allow(''),
    // meta_description: Joi.string(),
    // short_description: Joi.string(),
    // meta_keywords: Joi.array(),
    // additional_descriptions: Joi.array().items(
    //   Joi.object({
    //     label: Joi.string(),
    //     value: Joi.string(),
    //   })
    // ),
    // additional_properties: Joi.array().items(
    //   Joi.object({
    //     label: Joi.string(),
    //     value: Joi.string(),
    //   })
    // ),
    weight: Joi.number().required(),
    height: Joi.number().allow(''),
    length: Joi.number().allow(''),
    width: Joi.number().allow(''),
    // quantity_default: Joi.number().default(0),
    quantity_min: Joi.number().default(0),
    // quantity_max: Joi.number(),
    stock: Joi.number().default(0),
    // reviews_rating: Joi.number(),
    // allow_out_of_stock_purchase: Joi.boolean(),
    price: Joi.number().required(),
    discounted_price: Joi.number().allow(''),
    // price_includes_tax: Joi.boolean(),
    cost: Joi.number().allow(''),
    published: Joi.string().allow(''),
    // sales_count: Joi.number().default(0),
    category: Joi.array().items(
      Joi.object({
        label: Joi.string(),
        value: Joi.string(),
      })
    ),
    options: Joi.array().items(
      Joi.object({
        name: Joi.string().allow(''),
        values: Joi.array().allow(''),
        
      })
    ),
    variants: Joi.array().items(
      Joi.object({
        image: Joi.any().optional().allow(null),
        variantName: Joi.string().allow(''),
        price: Joi.number().required(),
        stock: Joi.number().required(),
        discounted_price: Joi.number().optional().allow(null),
      })
    ),
  }),
};

const getProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId),
  }),
};

const updateProduct = {
  params: Joi.object().keys({
    productId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    brand_id: Joi.string().custom(objectId),
    name: Joi.string().required(),
    sku: Joi.string().required(),
    // slug: Joi.string().required(),
    description_short: Joi.string().allow(''),
    // logo: Joi.string().required(),
    description: Joi.string().allow(''),
    // meta_title: Joi.string().allow(''),
    // meta_description: Joi.string(),
    // short_description: Joi.string(),
    // meta_keywords: Joi.array(),
    // additional_descriptions: Joi.array().items(
    //   Joi.object({
    //     label: Joi.string(),
    //     value: Joi.string(),
    //   })
    // ),
    // additional_properties: Joi.array().items(
    //   Joi.object({
    //     label: Joi.string(),
    //     value: Joi.string(),
    //   })
    // ),
    weight: Joi.number().required(),
    height: Joi.number().allow(''),
    length: Joi.number().allow(''),
    width: Joi.number().allow(''),
    // quantity_default: Joi.number().default(0),
    quantity_min: Joi.number().default(0),
    // quantity_max: Joi.number(),
    stock: Joi.number().default(0),
    // reviews_rating: Joi.number(),
    // allow_out_of_stock_purchase: Joi.boolean(),
    price: Joi.number().required(),
    discounted_price: Joi.number().allow(''),
    // price_includes_tax: Joi.boolean(),
    cost: Joi.number().allow(''),
    published: Joi.string().allow(''),
    // sales_count: Joi.number().default(0),
    category: Joi.array().items(
      Joi.object({
        label: Joi.string(),
        value: Joi.string(),
      })
    ),
    options: Joi.array().items(
      Joi.object({
        name: Joi.string().allow(''),
        values: Joi.array().allow(''),
        
      })
    ),
    variants: Joi.array().items(
      Joi.object({
        image: Joi.any().optional().allow(null),
        variantName: Joi.string().allow(''),
        price: Joi.number().required(),
        stock: Joi.number().required(),
        discounted_price: Joi.number().optional().allow(null),
      })
    ),
  })
  .options({ allowUnknown: true }),
   
};

const deleteProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
