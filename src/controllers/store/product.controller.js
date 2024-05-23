const httpStatus = require('http-status');
const path = require('path');
const fs = require('fs');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { productService, brandService} = require('../../services');
const { Brand, Property, ProductMedia, ProductVariant, Product } = require('../../models');

const formidable = require('formidable');


const uploadFolder = process.env.UPLOAD_FOLDER || '/var/www/html/media';
const MEDIA_URL = process.env.MEDIA_URL;



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

// function extractOptions(variants) {
//   const colorsSet = new Set();
//   const sizesSet = new Set();

//   variants.forEach(variant => {
//       const [size, color] = variant.variantName.split('-');
//       sizesSet.add(size);
//       colorsSet.add(color);
//   });

//   return {
//       options: {
//           colors: Array.from(colorsSet),
//           sizes: Array.from(sizesSet)
//       }
//   };
// }

const calculateDiscountedPercentage = (price,discountValue) => {
  console.log(price,discountValue)
  if(discountValue !== 0 && price != discountValue) {
    console.log('inside')
    const percentage = ((price - discountValue)/ price ) * 100;
    discounted_percentage = parseFloat(percentage.toFixed(0));
    return discounted_percentage
  }
  // if(price === discountValue) {
  //   return 0
  // }
  return 0
}

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
  try {
    const product = await productService.getProductById(req.params.productId);
    const brand = await brandService.getBrandById(product.brand_id);
    
    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }


    // if(product.discounted_percentage) {
    //   const percentage = ((product.price - 12)/ product.price ) * 100;
    //   discounted_percentage = parseFloat(percentage.toFixed(0));
    // }

    let discounted_percentage =  calculateDiscountedPercentage(product.price,product.discounted_price ? product.discounted_price : 0)
    // console.log(discounted_percentage)



    let options = {}
     options = product.options?.reduce((acc, option) => {
      acc[option.optionName + 's'] = option.options.map(opt => opt.value);
      return acc;
  }, {});
  
 
//   function findOption(variantComponent, optionType) {
//     return options[optionType].find(option => variantComponent.toLowerCase().includes(option.toLowerCase())) || 'Undefined';
// }


function findOption(variantComponent, optionType) {
  return options[optionType].find(option => variantComponent.toLowerCase().includes(option.toLowerCase())) || 'Undefined';
}

let media = []
let images = await ProductMedia.find({product_id:product._id}).exec()
// console.log('images',images);    
matchingImages = images.filter(image => image.title === 'Media');
matchingImages.forEach(image => {
  media.push({
    "url": image.file_name ? MEDIA_URL + image.file_name : ''
  });
});


const transformedVariants =   await Promise.all (product.productVariants.map(async(variant) => {
  const properties = {};
 
  // console.log(variant.variantName)
  // console.log(matchingImages)

 
  const matchingImage = await images.find(image => image.title === variant.variantName);
   
     if (matchingImage) {
      media.push({
        "url": matchingImage.file_name ? MEDIA_URL + matchingImage.file_name : '',
        "variantId": variant._id
      });
    } 
    
     

  // Iterate through options and find matching properties
  Object.keys(options).forEach(optionType => {
      const matchingOption = findOption(variant.variantName, optionType);
      if (matchingOption !== 'Undefined') {
          properties[optionType.slice(0, -1)] = matchingOption; 
      }
  });

  let discount_percent =  calculateDiscountedPercentage(variant.variantPrice,variant.variantDiscountedPrice)

  
  return {
      variantId: variant._id,
      ...properties,
      price: {
          currency: "AED",
          amount: variant.variantDiscountedPrice ?  variant.variantDiscountedPrice : variant.variantPrice,
          original_amount: variant.variantPrice,
          discount_percentage: discount_percent
      },
      stock: variant.variantStock,
       image: matchingImage.file_name ? MEDIA_URL +  matchingImage.file_name : ''
  };
}));

const brand_products = await Product.find({ brand_id: brand._id }).limit(10).exec();

const similar_products_in_brand = await Promise.all (brand_products.map(async(product) => {
   const percent =  calculateDiscountedPercentage(product.price,product.discounted_price ? product.discounted_price : 0)

let images = await ProductMedia.find({product_id:product._id}).exec()
// console.log('images',images);    
matchingImages = images.filter(image => image.title === 'Media');
const image = matchingImages[0]


  return {
    id: product._id,
    name: product.name,
    image: image ? MEDIA_URL +  image.file_name  : '',
    brand: {
      brand_id: brand._id,
      name: brand.name,
      logo: brand.logo ? MEDIA_URL + brand.logo : ''
    },
    price: {
      currency: "AED",
      amount: product.discounted_price ? product.discounted_price: product.price,
      original_amount: product.price,
      discount_percentage: percent
    }
  }
}))

const category_products = await Product.find({categories: { $all: product.categories }}).limit(10).exec();
  
const similar_products_in_category = await Promise.all (category_products.map(async(product) => {
  const percent =  calculateDiscountedPercentage(product.price,product.discounted_price ? product.discounted_price : 0)

let images = await ProductMedia.find({product_id:product._id}).exec()
// console.log('images',images);    
matchingImages = images.filter(image => image.title === 'Media');
const image = matchingImages[0]


 return {
   id: product._id,
   name: product.name,
   image: image ? MEDIA_URL +  image.file_name  : '',
   brand: {
      brand_id: brand._id,
     name: brand.name,
     logo: brand.logo ? MEDIA_URL + brand.logo : ''
   },
   price: {
     currency: "AED",
     amount: product.discounted_price ? product.discounted_price: product.price,
     original_amount: product.price,
     discount_percentage: percent
   }
 }
}))


    const data = {
       id: product._id,
       name: product.name,
       sku: product.sku,
       description: product.description,
       description_short: product.description_short,
       stock: product.stock,
       additional_descriptions: product.additional_descriptions,
       brand: {
        brand_id: brand._id,
        name: brand.name,
        logo: brand.logo ? MEDIA_URL +  brand.logo : '',
        description: brand.description
       },
       price: {
        currency: "AED",
        amount: product.discounted_price ? product.discounted_price: product.price,
        original_amount: product.price,
        discounted_percentage: discounted_percentage

       },
       options: options ,
       variants: transformedVariants,
       media: media,
       similar_products_in_brand: similar_products_in_brand,
       similar_products_in_category: similar_products_in_category
    }
    console.log(data);
    return res.json({status: 200, data: data})
    
  // res.send({
  //   product: product,
  //   brand: brand,
  //   productVariant: productVariant,
  //   productMedia: productMedia,
  //   variantProperties: variantProperties,
  // });
   
  } catch(err) {
    throw err
  }
 
 

 

});



module.exports = {
 
  getProducts,
  getProduct,
 
 
};
