const httpStatus = require('http-status');
const { Product, Brand, Category } = require('../models');
const ApiError = require('../utils/ApiError');
const path = require('path');
const fs = require('fs');
const generateSlug = require('./generateSlug');
const { uploadSingleFile, uploadMultipleMediaFiles } = require('./fileUpload.service');
const { createProductMedia } = require('./product_media.service');

const uploadFolder = process.env.UPLOAD_FOLDER || '/var/www/html/media';

const createProduct = async (productBody,req_files) => {

  
  try {
    const slug = generateSlug(productBody.name);

    const cats = productBody.category?.map(cat => {
      return cat.value
    })


  
    const product = new Product({
      brand_id: productBody.brand_id,
      sku: productBody.sku,
      name: productBody.name,
      slug: slug,
      description_short: productBody.description_short,
      description: productBody.description,
      additional_descriptions: productBody.additional_descriptions,
    
      weight: productBody.weight,
      length: productBody.length,
      width: productBody.width,
      height: productBody.height,
  
      quantity_min: productBody.quantity_default,
     
      stock: productBody.stock,
      // reviews_rating: productBody.reviews_rating,
   
      price: productBody.price,
      discounted_price: productBody.discounted_price,
    
      cost: productBody.cost,
      published: productBody.published,
      categories: cats,
      productVariants: productBody.productVariants,
      options: productBody.options
      // sales_count to be calculated
  
    })

    if(product.save()) {
                    
                await Promise.all(productBody.productVariants?.map(async (variant, index) => {
                  // Check if the productVariant[0][image] field is empty
                  if (req_files && req_files[`productVariants[${index}][image]`]) {
                    console.log('inside varian image')
                    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp','webp'];
                    const imageFile = req_files[`productVariants[${index}][image]`];
                    const fileSize = imageFile.size;
                    const variantImage = uploadSingleFile(imageFile);
                    const fileExtension = variantImage.split('.').pop();
                    // console.log(fileExtension);
                    // console.log(variant.name);
                    let file_type = '';
                    if (imageExtensions.includes(fileExtension.toLowerCase())) {
                      file_type = 'image';
                    } else {
                      file_type = 'video';
                    }
    
                    const mediaBody = {
                      disk_name: 'media',
                      file_name: variantImage,
                      product_id: product._id,
                      // variant_id: variant.id,
                      title: variant.variantName, //how to save title
                      filesize: fileSize,
                      type: file_type,
                    };
                    
    
                     const media = await createProductMedia(mediaBody);
                    //  media.save();
                      console.log(media);
                    // Process the image file
                  } else {
                    // The field is empty
                    // Handle empty image field
    
                    // return res.status(400).json({ error: 'Image file is required' });
                  }
                }));
  
                const files = req_files['files[]'];
                // console.log(files);
  
                  if (files) {
                    // Check if files is an array
                    if (Array.isArray(files)) {
                      // Multiple files uploaded
                      files.forEach(async(file) => {
                        console.log('Array File:', file.originalFilename);
                        console.log(file.size)
                        const fileName = Date.now() + file.originalFilename;
                        const file_path = path.join(uploadFolder, fileName);
                        fs.renameSync(file.filepath, file_path); // Move file to desired location
            
                        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
            
                        const fileSize = file.size;
            
                        const fileExtension = fileName.split('.').pop();
                        // console.log(fileExtension);
                        // console.log(variant.name);
                        let file_type = '';
                        if (imageExtensions.includes(fileExtension.toLowerCase())) {
                          file_type = "image";
                        } else {
                          file_type = "video";
                        }
                        const mediaBody = {
                          disk_name: "media",
                          file_name: fileName,
                          product_id: product._id,
                          // variant_id: null,
                          title: "Media", //how to save title
                          filesize: fileSize,
                          type: file_type,
                        };
                        // console.log(mediaBody);
                         const media = await createProductMedia(mediaBody);
                        // // console.log(media);
                          media.save();
            
                        // uploadedFiles.push(fileName);
                      });
                    } else {
                      // Single file uploaded
                      console.log('File:', files.originalFilename);
                      const fileName = Date.now() + files.originalFilename;
                      const file_path = path.join(uploadFolder, fileName);
                      fs.renameSync(files.filepath, file_path); // Move file to desired location
            
                      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
            
                      const fileSize = files.size;
            
                      const fileExtension = fileName.split('.').pop();
                      // console.log(fileExtension);
                      // console.log(variant.name);
                      let file_type = '';
                      if (imageExtensions.includes(fileExtension.toLowerCase())) {
                        file_type = 'image';
                      } else {
                        file_type = 'video';
                      }
                      const mediaBody = {
                        disk_name: 'media',
                        file_name: fileName,
                        product_id: product._id,
                        // variant_id: null,
                        title: 'Media', //how to save title
                        filesize: fileSize,
                        type: file_type,
                      };
            
                      const media = await createProductMedia(mediaBody);
                      // console.log(media);
                       media.save();
                    }
                  } 
                  
         
     await Promise.all(cats?.map(async (cat) => {
    
          const category = await Category.findById(cat);
          if (category) {
              category.products.push(product._id);
              await category.save(); // Save the category to persist changes
          } else {
              console.log(`Category with id ${cat} not found`);
          }
    
  }));
}
    
    return product

  } catch (err) {
     return err
  }
 
 
};

const queryProducts = async (filter, options) => {
    // const brands = await Brand.paginate(filter, options);
    // const products = await Product.find({});
    const products = await Product.find({}).sort({ createdAt: -1 });

    return products;
  };

  const getProductById = async (id) => {
    const product = await Product.findById(id).exec();
    // const brand = await Brand.findById(product.brand_id);
    // console.log(brand);
    //  console.log(product);
    return product
  };

  const updateProductById = async (productId, productBody) => {
    

  console.log("Product" + productBody);

    try {
      let product = await getProductById(productId);
      // console.log(product)
      if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
      }
      const slug = generateSlug(productBody.name);
     
  
      const cats = productBody.category?.map(cat => {
        return cat.value
      })
      
        product.brand_id = productBody.brand_id,
     
        product.sku =  productBody.sku,
        product.name = productBody.name,
        product.slug = slug,
        product.description_short = productBody.description_short,
        product.description = productBody.description,
        product.meta_title = productBody.meta_title,
        product.meta_description = productBody.meta_description,
        product.meta_keywords = productBody.meta_keywords,
        product.additional_properties = productBody.additional_properties,
        product.weight = productBody.weight,
        product.length = productBody.length,
        product.width = productBody.width,
        product.height = productBody.height,
        product.quantity_default = productBody.quantity_default,
        product.quantity_min = productBody.quantity_default,
        product.quantity_max = productBody.quantity_max,
        product.stock = productBody.stock,
        // reviews_rating: productBody.reviews_rating,
        product.allow_out_of_stock_purchase = productBody.allow_out_of_stock_purchase,
        product.price = productBody.price,
        product.discounted_price = productBody.discounted_price,
        // price_includes_tax: productBody.price_includes_tax,
        product.cost = productBody.cost,
        product.published = productBody.published,
        product.categories = cats
        // sales_count to be calculated
        // console.log(product)
       
        let add_discriptions = [];
        let add_properties = [];
        console.log(productBody.addtional_description);
        
        if(typeof productBody.additional_descriptions !== 'undefined' && productBody.additional_descriptions.length > 0) {
            productBody.additional_descriptions?.map((doc,index) => {
                add_discriptions.push({label:doc.label,value: doc.value })
            })
            product.additional_descriptions = add_discriptions;
        }
    
        if(typeof productBody.additional_properties !== 'undefined' && productBody.additional_properties.length > 0) {
            productBody.additional_properties?.map((doc,index) => {
                add_properties.push({label:doc.label,value: doc.value })
            })
            product.additional_properties = add_properties;
            // console.log(product.additional_properties)
    
        }
       
      
      
      //  console.log(product)
      await product.save();
      
       return product
  
    } catch (err) {
       return err
    }
  };
  
  const deleteProductById = async (productId) => {
    const product = await getProductById(productId);
    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }
    await product.remove();
    
  };

  

module.exports = {
  createProduct,
  queryProducts,
  getProductById,
  updateProductById,
  deleteProductById
};
