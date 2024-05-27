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

const createProduct = async (productBody, req_files) => {
  //  console.log(req_files)
  //  console.log(productBody)
  try {
    const slug = generateSlug(productBody.name);

    const cats = productBody.category?.map((cat) => {
      return cat.value;
    });

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
      product_variants: productBody.productVariants,
      options: productBody.options,
      // sales_count to be calculated
    });

   let mediaItems = productBody.mediaItems
  
    
    if (await product.save()) {
     
      // const mediaLength = productBody.mediaItems.length();
  
      // if (req_files) {
       
      //   Object.values(req_files).forEach(async(file, index) => {
      //     if( mediaItems[index].file_name =  file.originalFilename) {
      //       // console.log("File:", file.originalFilename);
      //       const fileName = Date.now() + file.originalFilename;
      //       const file_path = path.join(uploadFolder, fileName);
      //       fs.renameSync(file.filepath, file_path); // Move file to desired location
        
      //       const fileSize = file.size;
      //       const fileExtension = fileName.split(".").pop().toLowerCase();
                   
      //       mediaItems[index].file_name = fileName
      //     }
         
         
      // })
       
      // }
      if (req_files) {
        const fileKeys = Object.keys(req_files);
      
        for (const [index, key] of fileKeys.entries()) {
          const file = req_files[key];
          if (mediaItems[index].file_name === file.originalFilename) {
            const fileName = Date.now() + file.originalFilename;
            const file_path = path.join(uploadFolder, fileName);
      
            try {
              await fs.rename(file.filepath, file_path); // Move file to desired location
              const fileSize = file.size;
              const fileExtension = fileName.split('.').pop().toLowerCase();
      
              mediaItems[index].file_name = fileName;
            } catch (err) {
              console.error('Error moving file:', err);
            }
          }
        }
      }
    
      console.log(mediaItems)
    

      // product.media = [...mediaItems];
      await product.updateOne({ $set: {media: mediaItems } });

     console.log('media',product.media);  
  //  await Promise.all(
  //       cats?.map(async (cat) => {
  //         const category = await Category.findById(cat);
  //         if (category) {
  //           category.products.push(product._id);
  //           await category.save(); // Save the category to persist changes
  //         } else {
  //           console.log(`Category with id ${cat} not found`);
  //         }
  //       })
  //     );
     };


    await product.save();
    // console.log(product);
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
  const product = await Product.findById(id).exec();
  // const brand = await Brand.findById(product.brand_id);
  // console.log(brand);
//  console.log(product)
  return product;
};

const updateProductById = async (productId, productBody, req_files) => {
  // console.log(productBody);
  // console.log(req_files);
  try {
    const slug = generateSlug(productBody.name);

    const cats = productBody.category?.map((cat) => {
      return cat.value;
    });

    const product = await Product.findById(productId).exec();
    //  console.log(product)

    product.brand_id = productBody.brand_id;
    product.sku = productBody.sku;
    product.name = productBody.name;
    product.slug = slug;
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

    product.price = productBody.price;
    product.discounted_price = productBody.discounted_price;

    product.cost = productBody.cost;
    product.published = productBody.published;
    product.categories = cats;

    product.options = productBody.options;
    // product.product_variants = productBody.productVariants;
    // console.log(product.product_variants)
    // console.log(productBody.productVariants)

   
    if (productBody.deletedImages?.length > 0) {
      // console.log("inside deleted image");

      // console.log(media_images)

       const deleteImagePromise =  productBody.deletedImages?.map(async (file_name) => {
          const imageName = file_name;
          // console.log(imageName)
          const imagePath = path.join(uploadFolder, imageName);
          fs.access(imagePath, fs.constants.F_OK, (err) => {
            if (err) {
              console.error("File does not exist:", imagePath);
            } else {
              fs.unlink(imagePath, (err) => {
                if (err) {
                  console.error("Error deleting image:", err);
                } else {
                  console.log("Image deleted successfully:", imagePath);
                }
              });
            }
          });
          await product.updateOne({
            $pull: { media: { file_name: file_name } },
          });
        })
     
        await Promise.all(deleteImagePromise);
      //  console.log('product', product.media.images);
    }

   

    if (productBody.oldImageIndex?.length > 0) {
      let variant_images = product.media?.filter(
        (media) => media.variant_id !== ""
      );

      
      const oldImageReplacePromise = productBody.oldImageIndex?.map(async (image, index) => {
          // console.log(variant_images)
          const img = variant_images.find(
            (img) => img.variant_id === image.variant_id
          );
          console.log('img',img);
          if (req_files && req_files[`oldVariantImages[]`]) {
            if (img) {
              const imageName = img.file_name;

              const imagePath = path.join(uploadFolder, imageName);
              //  console.log(imagePath);
              if (imagePath) {
                fs.access(imagePath, fs.constants.F_OK, (err) => {
                  if (err) {
                    // File does not exist
                    console.error("File does not exist:", imagePath);
                  } else {
                    // File exists, proceed to delete
                    fs.unlink(imagePath, (err) => {
                      if (err) {
                        console.error("Error deleting image:", err);
                      } else {
                        console.log("Image deleted successfully:", imagePath);
                      }
                    });
                  }
                });
              }
              const updatedFiles = req_files[`oldVariantImages[]`];

              if (updatedFiles) {
                // Check if files is an array
                if (Array.isArray(updatedFiles)) {
                  console.log("array");
                  // Multiple files uploaded
                  updatedFiles.forEach(async (file) => {
                    if (file.originalFilename === image.name) {
                      const fileSize = file.size;

                      const variantImage = uploadSingleFile(file);

                      img.file_name = variantImage;
                      img.file_size = fileSize;
                    }
                    console.log(img);
                  });
                } else {
                  console.log("single file");
                  const fileSize = updatedFiles.size;

                  const variantImage = uploadSingleFile(updatedFiles);

                  img.file_name = variantImage;
                  img.file_size = fileSize;
                }
              }
            }
            await Product.updateOne(
              { _id: product._id, "media.variant_id": img.variant_id },
              { $set: { "media.$": img } }
            );
            // variant_images[image.index] = img;
            // product.media.variant_images = variant_images;
            // product.save()
          }
        })
        await Promise.all(oldImageReplacePromise);
    }
    
    console.log('after oldimageindex')
    const files = req_files["files[]"];
    // console.log(files);

    if (files) {
      let images = [];
      if (files) {
        images = await handleFiles(product, files);

        product.media = [...product.media, ...images];
        //  console.log('product_media', product.media)
        await product.updateOne({ $set: { media: product.media } });
      }
    }
    console.log('after files')
    if (productBody.productVariantsNew) {
     
      // remove old variant images
      const promises =  product.product_variants?.map(async (variant) => {
       
         const img = product.media.find((item) => {
          console.log('item.variant_id:', item.variant_id);
          console.log('item.variant_id type:', typeof item.variant_id);
          console.log('variant._id:', variant._id);
          console.log('variant._id type:', typeof variant._id);
          return String(item.variant_id) === String(variant._id);
        });
    
        console.log('img:', img);
     
        if (img) {
          
          const imageName = img.file_name;

          const imagePath = path.join(uploadFolder, imageName);
          //  console.log(imagePath);
          if (imagePath) {
            fs.access(imagePath, fs.constants.F_OK, (err) => {
              if (err) {
                // File does not exist
                console.error("File does not exist:", imagePath);
              } else {
                // File exists, proceed to delete
                fs.unlink(imagePath, (err) => {
                  if (err) {
                    console.error("Error deleting image:", err);
                  } else {
                    console.log("Image deleted successfully:", imagePath);
                  }
                });
              }
            });
          }
          
        }
        await product.updateOne({
          $pull: { media: { variant_id: variant._id } },
        });
        //
      });
      await Promise.all(promises);
      console.log('media after delete', product.media)

      product.product_variants = productBody.productVariantsNew;
      if(product.save()) {
        const variant_images = [];
        const imageUploadPromises =  product.product_variants?.map(async (variant, index) => {
           console.log('product new variant',variant)
          const imageFile = req_files[`productVariantsNew[${index}][image]`];
  
          if (imageFile) {
            // console.log("inside variant image");
  
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

        await Promise.all(imageUploadPromises);
        console.log('variant image', variant_images)

       
      
        product.media = [...product.media, ...variant_images];
        // product.media = [...product.media, ...variant_images];
       
        console.log('product media',product.media)
        //  await product.save()
        await product.updateOne({ $set: {media: product.media } });
      }
    
    }
    console.log('after productvariantnew')

   
      cats?.map(async (cat) => {
        const category = await Category.findById(cat);
        if (category) {
          category.products.push(product._id);
          await category.save(); // Save the category to persist changes
        } else {
          console.log(`Category with id ${cat} not found`);
        }
      })
   

    console.log('reached here')
    if(await product.save()) {
      const updated_product = product;
       console.log(updated_product);
    }

       
    return product;
  } catch (err) {
    return err;
  }
};

const deleteProductById = async (productId) => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }
  await product.remove();
};

module.exports = {
  createProduct,
  queryProducts,
  getProductById,
  updateProductById,
  deleteProductById,
};
