const mongoose = require('mongoose');

const httpStatus = require("http-status");
const { Product, Brand, Category, ProductMedia } = require("../models");
const ApiError = require("../utils/ApiError");
const path = require("path");
// const fs = require("fs");
const fs = require('fs').promises;
const generateSlug = require("./generateSlug");
const {
  uploadSingleFile,
  uploadMultipleMediaFiles,
  uploadMultipleFile,
} = require("./fileUpload.service");
const { createProductMedia } = require("./product_media.service");

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
        fs.renameSync(file.filepath, file_path); // Move file to desired location

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
    fs.renameSync(files.filepath, file_path); // Move file to desired location

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

    // Assign all other properties
    const fields = [
      'brand_id',
      'sku',
      'name',
      'description_short',
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
      'categories',
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
  const products = await Product.find({}).sort({ createdAt: -1 });

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
    fs.unlink(filePath, (err) => {
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

module.exports = {
  saveProduct,
  createProduct,
  queryProducts,
  getProductById,
  updateProductById,
  deleteProductById,
};
