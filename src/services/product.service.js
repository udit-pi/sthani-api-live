const httpStatus = require("http-status");
const { Product, Brand, Category, ProductMedia } = require("../models");
const ApiError = require("../utils/ApiError");
const path = require("path");
const fs = require("fs");
const generateSlug = require("./generateSlug");
const {
  uploadSingleFile,
  uploadMultipleMediaFiles,
} = require("./fileUpload.service");
const { createProductMedia } = require("./product_media.service");

const uploadFolder = process.env.UPLOAD_FOLDER || "/var/www/html/media";

const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
async function handleProductVariants(product, productBody, req_files) {
  if (req_files) {
    
      productBody.productVariants.map(async (variant, index) => {
        const imageFile = req_files[`productVariants[${index}][image]`];
        console.log(imageFile)
        if (imageFile) {
          console.log("inside variant image");

          const fileSize = imageFile.size;
          const variantImage = await uploadSingleFile(imageFile); // Ensure this returns a file name
          const fileExtension = variantImage.split(".").pop().toLowerCase();

          const file_type = imageExtensions.includes(fileExtension)
            ? "image"
            : "video";

          const mediaBody = {
            disk_name: "media",
            file_name: variantImage,
            product_id: product._id,
            title: variant.variantName, // Save title correctly
            filesize: fileSize,
            type: file_type,
          };

          const media = await createProductMedia(mediaBody);
          // console.log(media);
        }
      })
      
      }
}

async function handleFiles(product, files) {
  const uploadedFiles = [];
  if (Array.isArray(files)) {
    // Multiple files uploaded
     Promise.all(files.map(async (file) => {
      console.log("Array File:", file.originalFilename);
      console.log(file.size);
      const fileName = Date.now() + file.originalFilename;
      const file_path = path.join(uploadFolder, fileName);
      fs.renameSync(file.filepath, file_path); // Move file to desired location

      const fileSize = file.size;
      const fileExtension = fileName.split(".").pop().toLowerCase();
      const file_type = imageExtensions.includes(fileExtension) ? "image" : "video";

      const mediaBody = {
        disk_name: "media",
        file_name: fileName,
        product_id: product._id,
        title: "Media", // Set a default title or change as needed
        filesize: fileSize,
        type: file_type,
      };

      const productMedia = await createProductMedia(mediaBody);
      product.image = productMedia.file_name;
      uploadedFiles.push(productMedia);
    }));
  } else {
    // Single file uploaded
    console.log("File:", files.originalFilename);
    const fileName = Date.now() + files.originalFilename;
    const file_path = path.join(uploadFolder, fileName);
    fs.renameSync(files.filepath, file_path); // Move file to desired location

    const fileSize = files.size;
    const fileExtension = fileName.split(".").pop().toLowerCase();
    const file_type = imageExtensions.includes(fileExtension) ? "image" : "video";

    const mediaBody = {
      disk_name: "media",
      file_name: fileName,
      product_id: product._id,
      title: "Media", // Set a default title or change as needed
      filesize: fileSize,
      type: file_type,
    };

    const productMedia = await createProductMedia(mediaBody);
    product.image = productMedia.file_name;
    uploadedFiles.push(productMedia);
  
  }
  return uploadedFiles;
}

const createProduct = async (productBody, req_files) => {
  // console.log(req_files)
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
      productVariants: productBody.productVariants,
      options: productBody.options,
      // sales_count to be calculated
    });

    if (product.save()) {
      const files = req_files["files[]"];
      // console.log(files);

      if (files) {
        await handleFiles(product, files);
       
       
      }

      // console.log('after files')
      await handleProductVariants(product, productBody, req_files);
    
      await Promise.all(
        cats?.map(async (cat) => {
          const category = await Category.findById(cat);
          if (category) {
            category.products.push(product._id);
            await category.save(); // Save the category to persist changes
          } else {
            console.log(`Category with id ${cat} not found`);
          }
        })
      );
    }

    
    await product.save()
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
  //  console.log(product);
  return product;
};

const updateProductById = async (productId, productBody, req_files) => {
  //  console.log(productBody.productVariants)
  try {
    const slug = generateSlug(productBody.name);

    const cats = productBody.category?.map((cat) => {
      return cat.value;
    });

    const product = await Product.findById(productId).exec();
    // console.log(product)

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
    product.productVariants = productBody.productVariants;
    product.productVariantsNew = productBody.productVariantsNew;

    if (productBody.productVariantsNew?.length > 0) {
      if (product.productVariants?.length > 0) {
        let images = await ProductMedia.find({
          product_id: product._id,
        }).exec();
        // console.log('images',images)
        if (images) {
          await Promise.all(
            product.productVariants?.map(async (variant) => {
              const matchingImage = images?.find(
                (img) => img.title === variant.variantName
              );
              const imageName = matchingImage.file_name;
              // console.log(imageName)
              if (imageName) {
                const imagePath = path.join(uploadFolder, imageName);
                //  console.log(imagePath);

                // Delete the image file from the file system
                fs.unlink(imagePath, (err) => {
                  if (err) {
                    console.error("Error deleting image:", err);
                    // return res
                    //   .status(500)
                    //   .json({ error: "Failed to delete image" });
                  }
                });
              }
              // console.log(imageName)
            })
          );
        }

        product.productVariants = productBody.productVariantsNew;
        //  console.log( product.productVariants)
      }

      await Promise.all(
        productBody.productVariantsNew?.map(async (variant, index) => {
          if (req_files && req_files[`productVariantsNew[${index}][image]`]) {
            //  console.log(req_files[`productVariantsNew[${index}][image]`]);
            const imageExtensions = [
              "jpg",
              "jpeg",
              "png",
              "gif",
              "bmp",
              "webp",
            ];
            const imageFile = req_files[`productVariantsNew[${index}][image]`];
            const fileSize = imageFile.size;
            const variantImage = uploadSingleFile(imageFile);
            // console.log('image',variantImage)
            const fileExtension = variantImage.split(".").pop();
            // console.log(fileExtension);
            // console.log(variant.name);
            let file_type = "";
            if (imageExtensions.includes(fileExtension.toLowerCase())) {
              file_type = "image";
            } else {
              file_type = "video";
            }

            const mediaBody = {
              disk_name: "media",
              file_name: variantImage,
              product_id: product._id,
              // variant_id: variant.id,
              title: variant.variantName, //how to save title
              filesize: fileSize,
              type: file_type,
            };

            await createProductMedia(mediaBody);
            //  media.save();
            // console.log(media);
            // Process the image file
          }
          // return;
        })
      );
    }
    if (productBody.deletedImages?.length > 0) {
      console.log("inside deleted image");
      await Promise.all(
        productBody.deletedImages?.map(async (mediaId) => {
          const image = await ProductMedia.findById(mediaId).exec();

          const imageName = image.file_name;
          // console.log(imageName)
          const imagePath = path.join(uploadFolder, imageName);
          // console.log(imagePath);

          // Delete the image file from the file system
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error("Error deleting image:", err);
              return res.status(500).json({ error: "Failed to delete image" });
            }
          });
          await image.remove();
        })
      );
    }

    if (productBody.oldImageIndex?.length > 0) {
      await Promise.all(
        productBody.oldImageIndex?.map(async (image, index) => {
          const media = await ProductMedia.findOne({
            product_id: product._id,
            title: image.variantName,
          }).exec();
          if (req_files && req_files[`oldVariantImages[]`]) {
            if (media) {
              const imageName = media.file_name;

              const imagePath = path.join(uploadFolder, imageName);
              //  console.log(imagePath);
              if (imagePath) {
                // Delete the image file from the file system
                fs.unlink(imagePath, (err) => {
                  if (err) {
                    console.error("Error deleting image:", err);
                    // return ({ error: "Failed to delete image" });
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

                      if (media) {
                        media.file_name = variantImage;
                        media.filesize = fileSize;
                        await media.save();
                      } else {
                        const mediaBody = {
                          disk_name: "media",
                          file_name: variantImage,
                          product_id: product._id,
                          // variant_id: null,
                          title: image.variantName, //how to save title
                          filesize: fileSize,
                          type: "image",
                        };
                        // console.log(mediaBody);
                        await createProductMedia(mediaBody);
                      }
                    }
                  });
                } else {
                  console.log("single file");
                  const fileSize = updatedFiles.size;

                  const variantImage = uploadSingleFile(updatedFiles);

                  if (media) {
                    media.file_name = variantImage;
                    media.filesize = fileSize;
                    await media.save();
                  } else {
                    const mediaBody = {
                      disk_name: "media",
                      file_name: variantImage,
                      product_id: product._id,
                      // variant_id: null,
                      title: image.variantName, //how to save title
                      filesize: fileSize,
                      type: "image",
                    };
                    // console.log(mediaBody);
                    await createProductMedia(mediaBody);
                  }
                }
              }
            }
          }
        })
      );
    }

    const files = req_files["files[]"];
    // console.log(files);

    if (files) {
      // Check if files is an array
      // if (Array.isArray(files)) {
      //   // Multiple files uploaded
      //   files.forEach(async (file) => {
      //     console.log("Array File:", file.originalFilename);
      //     console.log(file.size);
      //     const fileName = Date.now() + file.originalFilename;
      //     const file_path = path.join(uploadFolder, fileName);
      //     fs.renameSync(file.filepath, file_path); // Move file to desired location

      //     const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp"];

      //     const fileSize = file.size;

      //     const fileExtension = fileName.split(".").pop();
      //     // console.log(fileExtension);
      //     // console.log(variant.name);
      //     let file_type = "";
      //     if (imageExtensions.includes(fileExtension.toLowerCase())) {
      //       file_type = "image";
      //     } else {
      //       file_type = "video";
      //     }
      //     const mediaBody = {
      //       disk_name: "media",
      //       file_name: fileName,
      //       product_id: product._id,
      //       // variant_id: null,
      //       title: "Media", //how to save title
      //       filesize: fileSize,
      //       type: file_type,
      //     };
      //     // console.log(mediaBody);
      //     const productMedia = await createProductMedia(mediaBody);
      //     product.image = productMedia.file_name;
      //     // // console.log(media);
      //     // media.save();

      //      uploadedFiles.push(fileName);
      //   });
      // } else {
      //   // Single file uploaded
      //   console.log("File:", files.originalFilename);
      //   const fileName = Date.now() + files.originalFilename;
      //   const file_path = path.join(uploadFolder, fileName);
      //   fs.renameSync(files.filepath, file_path); // Move file to desired location

      //   const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp"];

      //   const fileSize = files.size;

      //   const fileExtension = fileName.split(".").pop();
      //   // console.log(fileExtension);
      //   // console.log(variant.name);
      //   let file_type = "";
      //   if (imageExtensions.includes(fileExtension.toLowerCase())) {
      //     file_type = "image";
      //   } else {
      //     file_type = "video";
      //   }
      //   const mediaBody = {
      //     disk_name: "media",
      //     file_name: fileName,
      //     product_id: product._id,
      //     // variant_id: null,
      //     title: "Media", //how to save title
      //     filesize: fileSize,
      //     type: file_type,
      //   };

      //   const productMedia = await createProductMedia(mediaBody);
      //   product.image = productMedia.file_name;
      //   // console.log(media);
      //   // media.save();
      // }
      const uploadedFiles = await handleFiles(product, files);
      // console.log(uploadedFiles)
      const media = await ProductMedia.find({product_id: product._id,title: 'Media'}).exec();
      console.log(media);
      product.image = media[0].file_name
  
       
    }

    await Promise.all(
      cats?.map(async (cat) => {
        const category = await Category.findById(cat);
        if (category) {
          category.products.push(product._id);
          await category.save(); // Save the category to persist changes
        } else {
          console.log(`Category with id ${cat} not found`);
        }
      })
    );

   
    await product.save();
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
