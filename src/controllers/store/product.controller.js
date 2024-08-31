const httpStatus = require('http-status');
const path = require('path');
const fs = require('fs');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { productService, brandService } = require('../../services');
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

const calculateDiscountedPercentage = (price, discountValue) => {
  console.log(price, discountValue)
  if (discountValue !== 0 && price != discountValue) {
    console.log('inside')
    const percentage = ((price - discountValue) / price) * 100;
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

const getUpsellingProducts = catchAsync(async (req, res) => {
  try {


    const result = await Product.find({ is_upsell: true }).sort({ createdAt: -1 }).limit(10).populate({
      path: 'brand_id',
    });;
    if (result && result.length > 0) {
      const upselling_products = await Promise.all(result.map(async (product) => {
        return getProductBasic(product);
      }))
      return res.send(upselling_products);
    } else {
      return res.status(404).json({ status: 404, message: 'No upselling products found' });
    }


  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


const getProduct = catchAsync(async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).populate({
      path: 'brand_id',
    });

    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }


    // if(product.discounted_percentage) {
    //   const percentage = ((product.price - 12)/ product.price ) * 100;
    //   discounted_percentage = parseFloat(percentage.toFixed(0));
    // }


    // console.log(discounted_percentage)



    //   let options = {}
    //    options = product.options?.reduce((acc, option) => {
    //     acc[option.optionName + 's'] = option.options.map(opt => opt.value);
    //     return acc;
    // }, {});


    //   function findOption(variantComponent, optionType) {
    //     return options[optionType].find(option => variantComponent.toLowerCase().includes(option.toLowerCase())) || 'Undefined';
    // }


    // function findOption(variantComponent, optionType) {
    //   return options[optionType].find(option => variantComponent.toLowerCase().includes(option.toLowerCase())) || 'Undefined';
    // }

    // let media = []
    // let images = await ProductMedia.find({product_id:product._id}).exec()
    // // console.log('images',images);    
    // matchingImages = images.filter(image => image.title === 'Media');
    // matchingImages.forEach(image => {
    //   media.push({
    //     "url": image.file_name ? MEDIA_URL + image.file_name : ''
    //   });
    // });


    // const transformedVariants =   await Promise.all (product.productVariants.map(async(variant) => {
    //   const properties = {};

    //   // console.log(variant.variantName)
    //   // console.log(matchingImages)


    //   const matchingImage = await images.find(image => image.title === variant.variantName);

    //      if (matchingImage) {
    //       media.push({
    //         "url": matchingImage.file_name ? MEDIA_URL + matchingImage.file_name : '',
    //         "variantId": variant._id
    //       });
    //     } 



    //   // Iterate through options and find matching properties
    //   Object.keys(options).forEach(optionType => {
    //       const matchingOption = findOption(variant.variantName, optionType);
    //       if (matchingOption !== 'Undefined') {
    //           properties[optionType.slice(0, -1)] = matchingOption; 
    //       }
    //   });

    //   let discount_percent =  calculateDiscountedPercentage(variant.variantPrice,variant.variantDiscountedPrice)


    //   return {
    //       variantId: variant._id,
    //       ...properties,
    //       price: {
    //           currency: "AED",
    //           amount: variant.variantDiscountedPrice ?  variant.variantDiscountedPrice : variant.variantPrice,
    //           original_amount: variant.variantPrice,
    //           discount_percentage: discount_percent
    //       },
    //       stock: variant.variantStock,
    //        image: matchingImage.file_name ? MEDIA_URL +  matchingImage.file_name : ''
    //   };
    // }));

    const brand_products = await Product.find({ brand_id: product.brand_id.id }).populate({ path: 'brand_id' }).limit(10).exec();

    const similar_products_in_brand = await Promise.all(brand_products.map(async (product) => {
      try {
        return await getProductBasic(product);
      } catch (error) {
        console.error(`Error fetching product: ${product.id}`, error);
        return null; // or any default value indicating failure
      }
    }))

    const category_products = await Product.find({ categories: { $all: product.categories } }).populate({ path: 'brand_id' }).limit(10).exec();

    const similar_products_in_category = await Promise.all(category_products.map(async (product) => {
      return getProductBasic(product);
    }))

    const productImages = product.media ? product.media.map(filename => MEDIA_URL + filename) : [];

    let brand_images;
    if (product.brand_id.images && product.brand_id.images.length > 0) {
      brand_images = product.brand_id.images.reduce((acc, img) => {
        acc[img.label] = `${MEDIA_URL}${img.value}`;
        return acc;
      }, {});
    }

    const productVariants = product.product_variants && Array.isArray(product.product_variants) ? product.product_variants.map(variant => ({
      variant_id: variant._id,
      name: variant.name,
      price: variant.price,
      discounted_price: variant.discounted_price,
      discount_percentage: variant.discounted_price ? Math.round(((variant.price - variant.discounted_price) / variant.price) * 100) : 0,
      stock: variant.stock,
      sku: variant.sku,
      image: variant.image ? `${MEDIA_URL}${variant.image}` : "",  // Prepend MEDIA_URL if image exists
    })) : [];


    const data = {
      Product_id: product._id,
      name: product.name,
      short_description: product.description_short,
      short_description_title: product.description_short_title,
      short_description_image: product.description_short_image ? `${MEDIA_URL}${product.description_short_image}` : "",
      image: productImages,

      brand: {
        brand_id: product.brand_id._id,
        name: product.brand_id.name,
        description: product.brand_id.description,

        logo: `${MEDIA_URL}${product.brand_id.logo}`,
        color: product.brand_id.color
      },
      price: {
        currency: "AED",
        amount: product.discounted_price ? product.discounted_price : product.price,
        original_amount: product.price,
        discount_percentage: product.discounted_price ? Math.round(((product.price - product.discounted_price) / product.price) * 100) : 0
      },
      tags: product.productTags || [],
      sku: product.sku,
      description: product.description,
      stock: product.stock,
      quantity_min: product.quantity_min,
      additional_descriptions: product.additional_descriptions,

      //options: options ,
      variants: productVariants,

      similar_products_in_brand: similar_products_in_brand,
      similar_products_in_category: similar_products_in_category
    }


    if (brand_images) {
      Object.assign(data.brand, brand_images);
    }
    console.log(data);

    return res.json({ status: 200, data: data })

    // res.send({
    //   product: product,
    //   brand: brand,
    //   productVariant: productVariant,
    //   productMedia: productMedia,
    //   variantProperties: variantProperties,
    // });

  } catch (err) {
    throw err
  }





});


function getProductBasic(product) {
  //console.log("Product in Basic", product);
  const productImages = product.media ? product.media.map(filename => MEDIA_URL + filename) : [];

  const productVariants = product.product_variants && Array.isArray(product.product_variants) ? product.product_variants.map(variant => ({
    variant_id: variant._id,
    name: variant.name,
    price: variant.price,
    discounted_price: variant.discounted_price,
    discount_percentage: variant.discounted_price ? Math.round(((variant.price - variant.discounted_price) / variant.price) * 100) : 0,
    stock: variant.stock,
    sku: variant.sku,
    image: variant.image ? `${MEDIA_URL}${variant.image}` : "",  // Prepend MEDIA_URL if image exists
  })) : [];

  return {
    Product_id: product._id,
    name: product.name,
    short_description: product.description_short,
    image: productImages,

    brand: {
      brand_id: product.brand_id.id,
      name: product.brand_id.name,
      logo: `${MEDIA_URL}${product.brand_id.logo}`,
      color: product.brand_id.color

    },
    price: {
      currency: "AED",
      amount: product.discounted_price ? product.discounted_price : product.price,
      original_amount: product.price,
      discount_percentage: product.discounted_price ? Math.round(((product.price - product.discounted_price) / product.price) * 100) : 0
    },
    variants: productVariants,


  };
}



module.exports = {

  getProducts,
  getProduct,
  getUpsellingProducts,

};
