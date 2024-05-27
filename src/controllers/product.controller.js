const httpStatus = require('http-status');
const path = require('path');
const fs = require('fs');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { productService, propertyService, productVariantService, productMediaService } = require('../services');
const { Brand, Property, ProductMedia, ProductVariant } = require('../models');
const generateSlug = require('../services/generateSlug');
const { find } = require('../config/logger');
const formidable = require('formidable');
const { uploadSingleFile, uploadMultipleMediaFiles } = require('../services/fileUpload.service');
const { createProductMedia } = require('./product_media.controller');
const product_variantModel = require('../models/product_variant.model');

const uploadFolder = process.env.UPLOAD_FOLDER || '/var/www/html/media';

const property_ids = [];
// const createProperty = async (variants) => {
//   variants?.map(async (variant) => {
//     if (variant.name === 'Custom') {
//       const doc = await Property.findOne({ name: variant.customName });
//       if (doc) {
//         console.log('Found documents:', doc);
//       } else {
//         const slug = generateSlug(variant.customName);
//         const property = new Property({
//           name: variant.customName,
//           // unit: req.body.unit,
//           options: variant.options,
//           slug: slug,
//         });
//         const newProperty = await property.save();
//         return newProperty;
//         // console.log(newProperty)
//       }
//     }
//   });
// };

const createProperty = async (variants) => {
  const createdProperties = [];
  await Promise.all(variants.map(async (variant) => {
    if (variant.name === 'Custom') {
      const doc = await Property.findOne({ name: variant.customName });
      if (doc) {
        console.log('Found document:', doc);
        createdProperties.push(doc);
      } else {
        const slug = generateSlug(variant.customName);
        const property = new Property({
          name: variant.customName,
          // unit: req.body.unit,
          options: variant.options,
          slug: slug,
        });
        const newProperty = await property.save();
        console.log('Created new property:', newProperty);
        createdProperties.push(newProperty);
      }
    }
  }));
  return createdProperties;
};


const findProperties = async (variants) => {
  // console.log(variants)
  if (variants) {
    for (const prop of variants) {
      let result;
      let propertyId;
      // console.log(prop)

      // Check if variant name is 'Custom'
      if (prop.name === 'Custom') {
        result = await Property.findOne({ name: prop.customName }).exec();
      } else {
        result = await Property.findOne({ name: prop.name }).exec();
      }
      // console.log(result)
      if (result) {
        propertyId = result._id;
        //  console.log('property ID: ' + propertyId)
        // Check if propertyId already exists in property_ids array
        if (!property_ids.includes(propertyId)) {
          // console.log('inside')
          property_ids.push(propertyId);
        }
      }
    }
    
    return property_ids;
  }
};

const getImageById = async (imageIdToFind) => {
  try {
    const image = await ProductMedia.findById(imageIdToFind);
    if (!image) {
      // console.log('Brand not found');
      return null;
    }
    return image;
  } catch (err) {
    console.log(err);
  }
};

const createProduct = catchAsync(async (req, res) => {
  try {
   
    
   
    // create new product
    const product = await productService.createProduct(req.body,req.files);
   console.log(product);
    if(product) {
      return res.status(201).json({status: 201, message: 'Product created successfully!',product: product });
    } else {
      return  res.status(400).json({status: 400, message: 'Error creating product' });
    }

   
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const getProducts = catchAsync(async (req, res) => {
  try {
    const filter = pick(req.query, ['name', 'role']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await productService.queryProducts(filter, options);
    // console.log(result)
    res.send(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const getProduct = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

 
  // const brand = await Brand.findById(product.brand_id);

  // const productVariant = await ProductVariant.find({ product_id: product._id }).exec();
  // console.log(productVariant)

  // const productMedia = await ProductMedia.find({ product_id: product._id }).exec();

  // const properties = await Property.find().exec();
  //  console.log(properties)
  //  console.log(productVariant)
  // let variantProperties = [];
  // if (productVariant && properties) {
  //   variantProperties = productVariant
  //     .map((prop) => {
  //       // console.log('Property ID:', prop._id);
  //       return properties.filter((item) => prop.property_id.includes(item._id));
  //     })
  //     .flat();
  // }

  // console.log('Variant Properties:', variantProperties);

  res.send({
    product: product,
    // brand: brand,
   
    
  
  });
});

const updateProduct = catchAsync(async (req, res) => {
 

  try {
        
    const product = await productService.updateProductById(req.params.productId,req.body,req.files);
  //  console.log(product)
    if(product) {
      return res.status(200).json({status: 200, message: 'Product updated successfully!' });
    } else {
      return  res.status(400).json({status: 400, message: 'Error creating product' });
    }

   
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
 
});

const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProductById(req.params.productId);
  res.status(httpStatus.NO_CONTENT).json({ message: 'Product deleted successfully!' });
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
