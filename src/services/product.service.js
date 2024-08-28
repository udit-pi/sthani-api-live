const mongoose = require('mongoose');
require('dotenv').config();
const axios = require('axios');
const csv = require('csv-parser');
const httpStatus = require("http-status");
const { Product, Brand, Category, ProductMedia } = require("../models");
const ApiError = require("../utils/ApiError");
const path = require("path");
// const fs = require("fs");
const fspromise = require('fs').promises;
const fs = require('fs');
const generateSlug = require("./generateSlug");
const {
  uploadSingleFile,
  uploadMultipleMediaFiles,
  uploadMultipleFile,
} = require("./fileUpload.service");
const { createProductMedia } = require("./product_media.service");

const { rename } = require('fs/promises'); // Correct import

const uploadFolder = process.env.UPLOAD_FOLDER || "/var/www/html/media";

const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];


async function handleProductVariants(product_variants, req_files) {
  const variant_images = [];
  if (req_files) {
    product_variants?.map(async (variant, index) => {
      const imageFile = req_files[`productVariants[${index}][image]`];

      if (imageFile) {
        console.log("inside variant image");

        const fileSize = imageFile.size;
        const variantImage = await uploadSingleFile(imageFile); // Ensure this returns a file name
        const fileExtension = variantImage.split(".").pop().toLowerCase();

        const file_type = imageExtensions.includes(fileExtension)
          ? "image"
          : "video";

        // const mediaBody = {
        //   disk_name: "media",
        //   file_name: variantImage,
        //   product_id: product._id,
        //   title: variant.variantName, // Save title correctly
        //   filesize: fileSize,
        //   type: file_type,
        // };

        variant_images.push({
          variant_id: variant._id,
          file_name: variantImage,

          file_size: fileSize,
          file_type: file_type,
        });

        // const media = await createProductMedia(mediaBody);
        // console.log(media);
      }
    });
  }
  return variant_images;
}

async function handleFiles(files) {

  if (Array.isArray(files)) {
    // Multiple files uploaded
    Promise.all(
      files.map(async (file) => {
        console.log("Array File:", file.originalFilename);
        console.log(file.size);
        const fileName = Date.now() + file.originalFilename;
        const file_path = path.join(uploadFolder, fileName);
        fspromise.renameSync(file.filepath, file_path); // Move file to desired location

        const fileSize = file.size;
        const fileExtension = fileName.split(".").pop().toLowerCase();
        const file_type = imageExtensions.includes(fileExtension)
          ? "image"
          : "video";

        images.push({
          file_name: fileName,
          variant_id: "", // Set a default title or change as needed
          file_size: fileSize,
          file_type: file_type,
        });

        // const mediaBody = {
        //   disk_name: "media",
        //   file_name: fileName,
        //   product_id: product._id,
        //   title: "Media", // Set a default title or change as needed
        //   filesize: fileSize,
        //   type: file_type,
        // };

        // const productMedia = await createProductMedia(mediaBody);
        // product.image = productMedia.file_name;
        return fileName;
      })
    );
  } else {
    // Single file uploaded
    console.log("File:", files.originalFilename);
    const fileName = Date.now() + files.originalFilename;
    const file_path = path.join(uploadFolder, fileName);
    fspromise.renameSync(files.filepath, file_path); // Move file to desired location

    const fileSize = files.size;
    const fileExtension = fileName.split(".").pop().toLowerCase();
    const file_type = imageExtensions.includes(fileExtension)
      ? "image"
      : "video";

    // const mediaBody = {
    //   disk_name: "media",
    //   file_name: fileName,
    //   product_id: product._id,
    //   title: "Media", // Set a default title or change as needed
    //   filesize: fileSize,
    //   type: file_type,
    // };

    images.push({
      file_name: fileName,
      variant_id: "", // Set a default title or change as needed
      file_size: fileSize,
      file_type: file_type,
    });

    // const productMedia = await createProductMedia(mediaBody);
    // product.image = productMedia.file_name;
    return fileName;
  }
  // return images;
}


const saveProduct = async (productBody, req, productId = null) => {
  try {
    
    const product = productId ? await Product.findById(productId).exec() : new Product();
    if (!product) {
      throw new Error('Product not found.');
    }

    // Generate slug only if it's a new product or name has changed
    if (!productId || product.name !== productBody.name) {
      product.slug = generateSlug(productBody.name);
    }

    // Handle media files
    if (req.files['media[]']) {
      const medias = uploadMultipleFile(req.files['media[]'])
      const mediasValues = medias.map(item => item.value);
      product.media = [...(productBody.media || []), ...mediasValues];
    } else {
      product.media = productBody.media || [];
    }

    // Handle description_short_image with extra checks
    if (req.files.description_short_image && Object.keys(req.files.description_short_image).length !== 0 && typeof req.files.description_short_image === 'object') {
      
      const shortImage = uploadSingleFile(req.files.description_short_image);
      
      product.description_short_image = shortImage; // Save the file path or URL
    } else {
      product.description_short_image = productBody.description_short_image || ""; 
    }

    // Assign all other properties
    const fields = [
      'brand_id',
      'sku',
      'name',
      'description_short',
      'description_short_title',
      'description',
      'additional_descriptions',
      'weight',
      'length',
      'width',
      'height',
      'quantity_min',
      'stock',
      'price',
      'discounted_price',
      'cost',
      'published',
      'is_upsell',
      'categories',
      'productTags',
      'options'
    ];
    fields.forEach(field => {
      if (productBody[field] !== undefined && productBody[field] !== "") {
        product[field] = productBody[field];
      }
    });

    // // Handle product variants
    // product.product_variants = productBody.productVariants ? productBody.productVariants.map(variant => {
    //   if (!variant._id) {
    //     return { ...variant, _id: new mongoose.Types.ObjectId() }; // Assign new _id for new variants
    //   }
    //   return variant; // Keep existing variants as is
    // }) : [];

    //console.log('Files uploaded', req.files);

    // Handle variant images and other data
    if (productBody.productVariants) {
      product.product_variants = await Promise.all(productBody.productVariants.map(async (variant, index) => {
        const variantKey = `productVariants[${index}][image]`;
        if (req.files[variantKey]) {  // Check if there's a file for this variant
          console.log(variant.name, req.files[variantKey]); // Log to verify the structure
          const file = req.files[variantKey];  // Directly use the file object
          variant.image = uploadSingleFile(file);  // Upload the file and get the filename
        }

        if (!variant._id) variant._id = new mongoose.Types.ObjectId();  // Assign new _id if it's a new variant

        return variant;
      }));
    }


    console.log("Product to be saved:", product);
    await product.save();
    return product;
  } catch (err) {
    console.error("Error processing product:", err);
    throw err; // Rethrow to handle the error outside this function
  }
};


const createProduct = async (productBody, req) => {
  //  console.log(req_files)
  //  console.log(productBody)
  try {
    const slug = generateSlug(productBody.name);

    const cats = productBody.category?.map((cat) => {
      return cat.value;
    });
    if (req.files['media[]']) {
      var medias = uploadMultipleFile(req.files['media[]'])
      var mediasValues = medias.map(item => item.value);
      if (!productBody.media || !Array.isArray(productBody.media)) {
        productBody.media = []; // Initialize slide_show as an array if it doesn't exist
      }

      var newMedia = [...productBody.media, ...mediasValues]
    }
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
      media: newMedia,
      price: productBody.price,
      discounted_price: productBody.discounted_price,
      is_upsell: productBody.is_upsell,

      cost: productBody.cost,
      published: productBody.published,
      categories: cats,
      product_variants: productBody.productVariants,
      options: productBody.options,
      // sales_count to be calculated
    });

    let mediaItems = productBody.mediaItems

    await product.save();

    return product;




  } catch (err) {
    return err;
  }
};

const queryProducts = async (filter, options) => {
  // const brands = await Brand.paginate(filter, options);
  // const products = await Product.find({});
  const products = await Product.find({}).sort({ updatedAt: -1 });

  return products;
};




const getProductById = async (id) => {
  const product = await Product.findById(id)
    // .populate({
    //   path: 'categories',
    //   select: 'id name',
    //   model: 'Category'
    // })
    .populate({
      path: 'brand_id',
      select: 'name',
      model: 'Brand'
    })
    .exec();
  // const brand = await Brand.findById(product.brand_id);
  // console.log(brand);
  //  console.log(product)
  return product;
};

const updateProductById = async (productId, productBody, req) => {


  try {
    const slug = generateSlug(productBody.name);

    // const cats = productBody.category?.map((cat) => {
    //   return cat.value;
    // });


    const product = await Product.findById(productId).exec();


    if (req.files['media[]']) {
      var medias = uploadMultipleFile(req.files['media[]'])
      var mediasValues = medias.map(item => item.value);
      if (!productBody.media || !Array.isArray(productBody.media)) {
        productBody.media = []; // Initialize slide_show as an array if it doesn't exist
      }

      product.media = [...productBody.media, ...mediasValues]
    } else {
      if (!productBody.media) {
        product.media = []
      } else {
        product.media = productBody.media
      }

    }


    product.brand_id = productBody.brand_id;
    product.sku = productBody.sku;
    product.name = productBody.name;
    // product.slug = slug;
    product.description_short = productBody.description_short;
    product.description = productBody.description;
    product.additional_descriptions = productBody.additional_descriptions;

    product.weight = productBody.weight;
    product.length = productBody.length;
    product.width = productBody.width;
    product.height = productBody.height;

    product.quantity_min = productBody.quantity_min;

    product.stock = productBody.stock;
    // reviews_rating: productBody.reviews_rating,
    // product.media=  productBody.media       
    product.price = productBody.price;
    product.discounted_price = productBody.discounted_price;

    product.cost = productBody.cost;
    product.published = productBody.published;
    product.categories = productBody.categories;
    product.is_upsell = productBody.is_upsell;

    product.options = productBody.options;
    //product.product_variants = productBody.productVariants;

    product.product_variants = productBody.productVariants.map(variant => {
      // Check if the variant has an _id, if not, it's a new variant
      if (!variant._id) {
        return { ...variant, _id: new mongoose.Types.ObjectId() }; // Explicitly setting _id for new variant
      }
      return variant; // Return existing variants as is
    });


    console.log("in api ---")
    console.log(product);

    await product.save()

    return product



  } catch (err) {
    console.log(err);
    return err;
  }
};

const deleteProductFiles = (mediaFiles) => {
  mediaFiles.forEach(fileName => {
    const filePath = path.join(uploadFolder, fileName);
    fspromise.unlink(filePath, (err) => {
      if (err) {
        console.error(`Failed to delete file: ${filePath}`, err);
      } else {
        console.log(`Successfully deleted file: ${filePath}`);
      }
    });
  });
};

const deleteProductById = async (productId) => {

  try {
    const product = await getProductById(productId);
    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Check if there are any associated media files to delete
    if (product.media && product.media.length > 0) {
      deleteProductFiles(product.media);  // Delete associated files
    }

    await product.remove();
    console.log('Product and its files have been deleted successfully.');
  } catch (error) {
    console.error('Failed to delete product:', error);
    throw error;  // Rethrow to handle the error in the calling function or to respond to a client request
  }
};


const getProductsByBrand = async (brandId) => {
  const brandObjectId = mongoose.Types.ObjectId(brandId); // Convert brandId to ObjectId
  return await Product.find({ brand_id: brandId });
};


const syncProductsWithIQ = async () => {
  // Fetch all products
  const allProducts = await Product.find({ published: true });

  // Map product and variant to SKU structure and prepare payloads
  const mapProductToSKU = (product, variant = null) => ({
    sku: variant ? variant._id || product._id : product._id,
    alternative_sku_name: variant ? variant.sku || product.sku : product.sku,
    sku_type: "Regular",
    description: variant ? `${product.name} - ${variant.name}` : product.name,
    weight: variant ? variant.weight || product.weight : product.weight,
    cube: variant ? (variant.length * variant.width * variant.height) : (product.length * product.width * product.height),
    length: variant ? variant.length || product.length : product.length,
    width: variant ? variant.width || product.width : product.width,
    height: variant ? variant.height || product.height : product.height,
    origin_country: "UAE",
    productId: product._id,
    variantId: variant ? variant._id : null
  });

  const createPayload = {
    skus: allProducts.reduce((acc, product) => {
      (product.product_variants && product.product_variants.length > 0 ? product.product_variants : [null]).forEach(variant => {
        if (variant ? !variant.isSyncedWithIQ : !product.isSyncedWithIQ) {
          acc.push(mapProductToSKU(product, variant));
        }
      });
      return acc;
    }, [])
  };

  const updatePayload = {
    skus: allProducts.reduce((acc, product) => {
      (product.product_variants && product.product_variants.length > 0 ? product.product_variants : [null]).forEach(variant => {
        if (variant ? variant.isSyncedWithIQ : product.isSyncedWithIQ) {
          acc.push(mapProductToSKU(product, variant));
        }
      });
      return acc;
    }, [])
  };

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${process.env.IQ_FULFILLMENT_TOKEN}`,
  };

  console.log("Products to create", createPayload.length)
  console.log("Products to update", updatePayload.length)

  // Perform API requests and update database
  try {
    let createdList = [], updatedList = [];
    if (createPayload.skus.length > 0) {
      const createResponse = await axios.post(process.env.IQ_FULFILLMENT_BULK_SKU_CREATE_URL, createPayload, { headers });
      if (createResponse.data.success) {
        createdList = createPayload.skus;
        // Update sync status for created items
        await Promise.all(createdList.map(async sku => {
          const updateCondition = sku.variantId ? { _id: sku.productId, "product_variants._id": sku.variantId } : { _id: sku.productId };
          const updateAction = sku.variantId ? { "$set": { "product_variants.$.isSyncedWithIQ": true, "product_variants.$.lastSyncWithIQ": new Date() } } : { "$set": { isSyncedWithIQ: true, lastSyncWithIQ: new Date() } };
          await Product.updateOne(updateCondition, updateAction);
        }));
      }
    }

    if (updatePayload.skus.length > 0) {
      const updateResponse = await axios.post(process.env.IQ_FULFILLMENT_BULK_SKU_UPDATE_URL, updatePayload, { headers });
      if (updateResponse.data.success) {
        updatedList = updatePayload.skus;
        // Update sync status for updated items
        await Promise.all(updatedList.map(async sku => {
          const updateCondition = sku.variantId ? { _id: sku.productId, "product_variants._id": sku.variantId } : { _id: sku.productId };
          const updateAction = sku.variantId ? { "$set": { "product_variants.$.isSyncedWithIQ": true, "product_variants.$.lastSyncWithIQ": new Date() } } : { "$set": { isSyncedWithIQ: true, lastSyncWithIQ: new Date() } };
          await Product.updateOne(updateCondition, updateAction);
        }));
      }
    }

    return {
      success: true,
      details: 'Products synced with IQ Fulfillment',
      created: createdList.map(sku => sku.description),
      updated: updatedList.map(sku => sku.description)
    };
  } catch (error) {
    console.error('Error syncing with IQ Fulfillment:', error);
    return { success: false, error: error.message };
  }
};

const importProducts = async (productsData) => {
  console.log("Starting import process");
  console.log("Imported data:", productsData);

  try {
    const productMap = new Map();

    for (const data of productsData) {
      console.log("Processing row:", data);

      // Skip empty rows in CSV
      if (!data['Slug']) {
        console.log("Skipping empty row");
        continue;
      }

      if (!productMap.has(data['Slug'])) {
        const productBody = {
          name: data['Name'] || '',
          sku: data['SKU'] || '',
          description_short: data['Short Description'] || '',
          description: data['Description'] || '',
          weight: data['Weight'] || '',
          length: data['Length'] || '',
          width: data['Width'] || '',
          height: data['Height'] || '',
          quantity_min: data['Minimum Quantity'] || '',
          stock: data['Stock'] || '',
          price: data['Price'] || '',
          discounted_price: data['Discounted Price'] || '',
          cost: data['Cost'] || '',
          media: [],
          published: data['Published'] === 'TRUE',
          is_upsell: data['Upselling'] === 'FALSE',
          categories: [],
          product_variants: [],
          additional_descriptions: []
        };

        // Add categories
        const categorySlugs = data['Categories'].split(', ');
        for (const slug of categorySlugs) {
          const category = await Category.findOne({ slug });
          if (category) {
            productBody.categories.push(category._id);
          }
        }

        productMap.set(data['Slug'], productBody);
      }

      const productBody = productMap.get(data['Slug']);

      // Add media if present
      if (data['Media']) {
        productBody.media.push(data['Media'].replace('mediaFolder/', ''));
      }

      // Add variants if present
      if (data['Variant Name']) {
        const variant = {
          name: data['Variant Name'],
          sku: data['Variant SKU'],
          price: data['Variant Price'],
          discounted_price: data['Variant Discounted Price'],
          stock: data['Variant Stock'],
          image: data['Variant Image'] ? data['Variant Image'].replace('mediaFolder/', '') : '',
        };
        productBody.product_variants.push(variant);
      }

      // Add additional descriptions if present
      if (data['Additional Description Label']) {
        const additionalDescription = {
          label: data['Additional Description Label'],
          value: data['Additional Description Value'],
        };
        productBody.additional_descriptions.push(additionalDescription);
      }
    }

    // Validate and check uniqueness without saving
    for (const [slug, productBody] of productMap.entries()) {
      try {
        const product = new Product(productBody);

        // Validate the product
        await product.validate();

        // Check for uniqueness of slug and name
        const existingProductWithSameSlug = await Product.findOne({ slug: product.slug });
        const existingProductWithSameName = await Product.findOne({ name: product.name });

        if (existingProductWithSameSlug) {
          console.error(`Product slug "${product.slug}" already exists in the database.`);
          continue;
        }

        if (existingProductWithSameName) {
          console.error(`Product name "${product.name}" already exists in the database.`);
          continue;
        }

        console.log(`Product ${slug} is valid and unique.`);
      } catch (validationError) {
        console.error(`Product ${slug} is invalid:`, validationError.message);
      }
    }

    console.log("Import validation process completed successfully");
    return true;
  } catch (error) {
    console.error('Error during product import (validation dry run):', error);
    throw error;
  }
};


const validateAndImportProducts = async (file, shouldImport) => {
  const results = [];
  const productMap = new Map();

  const fileName = Date.now() + '-' + file.originalFilename;
  const filePath = path.join(uploadFolder, fileName);

  console.log('File object:', file);
  const tempFilePath = file.filepath;
  console.log('Temporary File Path:', tempFilePath);

  try {
    await fspromise.rename(tempFilePath, filePath);
  } catch (error) {
    console.error('Error moving file:', error);
    throw error;
  }

  console.log("File Path ---- ", filePath);

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        try {
          const cleanedData = {};
          for (const key in data) {
            const cleanedKey = key.replace(/^\uFEFF/, ''); // Remove any BOM character from the key
            cleanedData[cleanedKey] = data[key];
          }

          console.log("Processing row:", cleanedData);

          if (!cleanedData['Slug']) {
            console.log("Skipping empty row");
            return;
          }

          if (!productMap.has(cleanedData['Slug'])) {
            const productBody = {
              name: cleanedData['Name'] || '',
              sku: cleanedData['SKU'] || '',
              description_short: cleanedData['Short Description'] || '',
              description: cleanedData['Description'] || '',
              weight: cleanedData['Weight'] || '',
              length: cleanedData['Length'] || '',
              width: cleanedData['Width'] || '',
              height: cleanedData['Height'] || '',
              quantity_min: cleanedData['Minimum Quantity'] || '',
              stock: cleanedData['Stock'] || '',
              price: cleanedData['Price'] || '',
              discounted_price: cleanedData['Discounted Price'] || '',
              cost: cleanedData['Cost'] || '',
              media: [],
              published: cleanedData['Published'] === 'TRUE',
              is_upsell: cleanedData['Upselling'] === 'FALSE',
              categories: cleanedData['Categories'] ? cleanedData['Categories'].split(', ') : [],
              product_variants: [],
              additional_descriptions: []
            };

            productMap.set(cleanedData['Slug'], productBody);
          }

          const productBody = productMap.get(cleanedData['Slug']);

          if (cleanedData['Media']) {
            productBody.media.push(cleanedData['Media'].replace('mediaFolder/', ''));
          }

          if (cleanedData['Variant Name']) {
            const variant = {
              name: cleanedData['Variant Name'],
              sku: cleanedData['Variant SKU'],
              price: cleanedData['Variant Price'],
              discounted_price: cleanedData['Variant Discounted Price'],
              stock: cleanedData['Variant Stock'],
              image: cleanedData['Variant Image'] ? cleanedData['Variant Image'].replace('mediaFolder/', '') : '',
            };
            productBody.product_variants.push(variant);
          }

          if (cleanedData['Additional Description Label']) {
            const additionalDescription = {
              label: cleanedData['Additional Description Label'],
              value: cleanedData['Additional Description Value'],
            };
            productBody.additional_descriptions.push(additionalDescription);
          }
        } catch (error) {
          console.error('Error processing data:', error);
          results.push({ isValid: false, message: `Error processing data: ${error.message}`, data });
        }
      })
      .on('end', async () => {
        console.log("Finished reading CSV. Starting validation...");
        let validationPassed = true;

        for (const [slug, productBody] of productMap.entries()) {
          try {
            const categoryIds = [];
            for (const categorySlug of productBody.categories) {
              const category = await Category.findOne({ slug: categorySlug });
              if (category) {
                categoryIds.push(category._id);
              }
            }
            productBody.categories = categoryIds;

            const product = new Product(productBody);
            await product.validate();
            console.log(`Product ${slug} is valid.`);


            if (shouldImport) {
              await product.save();
            }

            results.push({ isValid: true, message: `Product "${slug}" is valid.`, data: productBody });

          } catch (validationError) {
            validationPassed = false;
            console.error(`Product ${slug} is invalid:`, validationError.message);
            results.push({ isValid: false, message: `Product "${slug}" is invalid: ${validationError.message}`, data: productBody });

          }
        }

        resolve(results);
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
};


module.exports = {
  saveProduct,
  createProduct,
  queryProducts,
  getProductById,
  updateProductById,
  deleteProductById,
  syncProductsWithIQ,
  getProductsByBrand,
  validateAndImportProducts
};
