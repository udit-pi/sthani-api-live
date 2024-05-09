const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createCategory = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    // slug: Joi.string().required(),
    // code: Joi.string().required(),
    banner: Joi.string().optional(),
    icon: Joi.string().optional(),
    parent_category: Joi.string().optional(),

    description: Joi.string().optional(),
    slide_show: Joi.array().items(Joi.string()).optional(), 
    // meta_description: Joi.string().required(),

  }),
};


const getCategories = {
  query: Joi.object().keys({
    name: Joi.string(),
    slug: Joi.string(),
    code: Joi.string(),
    banner: Joi.string(),
    meta_title: Joi.string(),
    meta_description: Joi.string(),

    // sortBy: Joi.string(),
    // limit: Joi.number().integer(),
    // page: Joi.number().integer(),
  }),
};

const getCategory = {
  params: Joi.object().keys({
    categoryId: Joi.string().custom(objectId),
  }),
};

const updateCategory = {
  params: Joi.object().keys({
    categoryId: Joi.required().custom(objectId),
  }),
  // body: Joi.object()
  //   .keys({
  //       name: Joi.string(),
  //       // slug: Joi.string(),
  //       code: Joi.string(),
       
  //       meta_title: Joi.string(),
  //       meta_description: Joi.string(),
  //   })
    
};
const deleteCategory = {
    params: Joi.object().keys({
        categoryId: Joi.string().custom(objectId),
    }),
  };
  


module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory
}


