const httpStatus = require('http-status');
const { User, Brand } = require('../models');
const ApiError = require('../utils/ApiError');
const csv = require('csv-parser');
const path = require('path');
const fs = require('fs');
const { uploadSingleFile, uploadMultipleFile } = require('./fileUpload.service');
const generateSlug = require('./generateSlug');
const formidable = require('formidable');
const uploadFolder = process.env.UPLOAD_FOLDER || '/var/www/html/media';

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createBrand = async (req) => {
   console.log(req.files.logo)
  //  console.log(req.body)
  // const labelCount = req.files['images[]'].length
  // console.log(req.body.labels);

if(req.files.logo){

  var logo = uploadSingleFile(req.files.logo);
}
if(req.files['images[]']){

  var images = uploadMultipleFile(req.files['images[]'], req.body.labels);
}

if(req.files['slide_show[]']){
  var slide_show = uploadMultipleFile(req.files['slide_show[]'])
}
if(slide_show){

  var slideShowValues = slide_show.map(item => item.value);
}

  const slug = generateSlug(req.body.name);

  const brand = new Brand({
    name: req.body.name,
    description: req.body.description,
    website: req.body.website,
    slide_show:slideShowValues,
    logo: logo&&logo,
    images:images&& images,
    slug: slug,
    color: req.body.color
  });
  const newBrand = brand.save();
  return newBrand;

  // return User.create(userBody);
};

const queryBrands = async (filter, options) => {
  // const brands = await Brand.paginate(filter, options);
  const brands = await Brand.find().sort({ updatedAt: -1 });
  return brands;
};

const getBrandById = async (id) => {
  return Brand.findById(id);
};

// function to add images to images array
const addImagesToArray = async (brandId, newImagesArray) => {
  try {
    const updatedBrand = await Brand.findByIdAndUpdate(
      brandId,
      { $push: { images: { $each: newImagesArray } } },
      { new: true }
    );

    console.log('Updated brand with new images:', updatedBrand);
    return updatedBrand;
  } catch (error) {
    console.error('Error updating images:', error);
    throw error;
  }
};

// function to get image from brand table
const getImageById = async (brandId, imageIdToFind) => {
  try {
    const brand = await Brand.findById(brandId);
    if (!brand) {
      // console.log('Brand not found');
      return null;
    }

    const image = brand.images.find((image) => image._id.toString() === imageIdToFind.toString());
    if (!image) {
      // console.log('Image not found');
      return null;
    }

    // console.log('Found image:', image);
    return image;
  } catch (error) {
    // console.error('Error getting image:', error);
    throw error;
  }
};

// function to remove a image object
const removeImageById = async (brandId, imageIdToRemove) => {
  try {
    const updatedBrand = await Brand.findByIdAndUpdate(
      brandId,
      { $pull: { images: { _id: imageIdToRemove } } },
      { new: true }
    );

    // console.log('Updated brand:', updatedBrand);
    return updatedBrand;
  } catch (error) {
    // console.error('Error removing image:', error);
    throw error;
  }
};

const updateBrandById = async (brandId, req) => {
  // delete image from database and uploads directory

  if (req.body.deletedImages) {
    try {
      req.body.deletedImages?.map(async (imageId) => {
        const image = await getImageById(brandId, imageId);

        const imageName = image.value;
        // console.log(imageName)
        const imagePath = path.join(uploadFolder, imageName);
        // console.log(imagePath);

        // Delete the image file from the file system
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error('Error deleting image:', err);
            return res.status(500).json({ error: 'Failed to delete image' });
          }
        });
        const updatedBrand = await removeImageById(brandId, imageId);
        // console.log(updatedBrand);
      });
    } catch (err) {
      throw err;
    }
  }

  // update brand model

  const brand = await getBrandById(brandId);
  if (!brand) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Brand not found');
  }

  let logo = brand.logo;
  let images = [];

  //  console.log(req.files)
  
 
 
  if (req.files.logo) {
    logo = uploadSingleFile(req.files.logo);
    brand.logo =  logo
  }
 
  // if(typeof  req.files['images[]'] === 'Object' && req.files['images[]'] !== null) {
  //   req.files['images[]'] =  [req.files['images[]']] 
  //  console.log(true)
  //  console.log(req.files['images[]'])
  // } else {
  //   console.log('false')
  // }
  // console.log(req.files['images[]'])
  if(!Array.isArray( req.files['images[]'] ) && req.files['images[]'] !== null && typeof req.files['images[]'] !== 'undefined') {
    // images = uploadMultipleFile(req.files['images[]'], req.body.labels);
    // // console.log(images);
    // const updatedImagesArray = await addImagesToArray(brandId,images)
    req.files['images[]'] =  [req.files['images[]']] 
    console.log(true)
  } else {
    console.log('false')
  }
  
   
  // console.log(req.files)



  if (typeof req.files['images[]'] !== 'undefined' &&  req.files['images[]'] !== null) {
    
    // console.log(req.files['images[]'])
    images = uploadMultipleFile(req.files['images[]'], req.body.labels);
    // console.log(images);
    const updatedImagesArray = await addImagesToArray(brandId,images)
    // console.log(updatedImagesArray)
  }
// console.log( "Hello" ,req.files['slide_show[]'])



if(!brand.slide_show){
  brand.slide_show=[]
}else{
  brand.slide_show=req.body.slide_show
} 
  if (req.files['slide_show[]']) {
   

    var slide_showImage = uploadMultipleFile(req.files['slide_show[]']);
    var slideShowValues = slide_showImage.map(item => item.value);
    // Check if slide_show array exists in updateBody
    if (!brand.slide_show || !Array.isArray(brand.slide_show)) {
        brand.slide_show = []; // Initialize slide_show as an array if it doesn't exist
    }

    // Add the new slide_showImage to the slide_show array
    // brand.slide_show.push(slide_showImage);
    brand.slide_show=[... brand.slide_show, ...slideShowValues]
}

   
    
  

  const slug = generateSlug(req.body.name);

  brand.name = req.body.name
  
  brand.description = req.body.description 
  brand.website =  req.body.website
  brand.color = req.body.color
  brand.slug = slug
  brand.trending_products = req.body.trending_products || []; 
  await brand.save()

  return brand;

  //  console.log(req.body)
  //  console.log(req.files)
  // const images = Object.keys(req.files).map((key) => {
  //   const matches = key.match(/\[(\d+)\]/); // Extract index from key
  //   if (matches && matches[1]) {
  //     const index = parseInt(matches[1]); // Parse index as integer
  //     return { index, filename: req.files[key] }; // Return image object
  //   }
  //   return null;
  // });
  // images.map(image => {
  //   console.log(image.filename)
  // })
  // let logo;
  // let images = [];
  // if(req.files.logo[0]) {
  //   logo = uploadSingleFile(req.files.logo[0])
  // }
  // if(req.files.images) {
  //   images = uploadMultipleFile(req.files.images)
  // }

  // const brand = await getBrandById(brandId);
  // if (!brand) {
  //   throw new ApiError(httpStatus.NOT_FOUND, 'Brand not found');
  // }

  // Object.assign(brand, updateBody);
  // await brand.save();
  // return brand;
};

// return User.create(userBody);

const deleteBrandById = async (brandId) => {
  const brand = await getBrandById(brandId);
  // console.log( "Hello brand",brand)

  if (!brand) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Brand not found');
  }
  const logo = brand.logo;

  // Construct the path to the image file
  const imagePath = path.join(uploadFolder, logo);

  // Delete the image file from the file system
  fs.unlink(imagePath, (err) => {
    if (err) {
      console.error('Error deleting image:', err);
      return res.status(500).json({ error: 'Failed to delete image' });
    }
  });

  const images = brand.images;
  images.map((image) => {
    const imageName = image.value;
    const imagePath = path.join(uploadFolder, imageName);

    // Delete the image file from the file system
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error('Error deleting image:', err);
        return res.status(500).json({ error: 'Failed to delete image' });
      }
    });
  });

  await brand.remove();
  return brand;
};

const validateBrands = async (file) => {
  const results = [];
  const brandMap = new Map();

  const fileName = Date.now() + '-' + file.originalFilename;
  const filePath = path.join(uploadFolder, fileName);

  console.log('File object:', file);

  const tempFilePath = file.filepath;
  console.log('Temporary File Path:', tempFilePath);

  try {
    await fs.promises.rename(tempFilePath, filePath);
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
          console.log("Processing row:", data);

          if (!data['slug']) {
            console.log("Skipping empty row");
            return;
          }

          if (!brandMap.has(data['slug'])) {
            const brandBody = {
              name: data['name'] || '',
              slug: data['slug'] || '',
              description: data['description'] || '',
              color: data['color'] || '#E21556',
              logo: data['logo'] || '',
              slide_show: data['slide_show'] ? data['slide_show'].split(', ') : [],
              images: data['images'] ? data['images'].split(', ').map(image => ({ label: '', value: image })) : [],
              website: data['website'] || '',
              sort_order: data['sort_order'] || 0,
            };

            brandMap.set(data['slug'], brandBody);
          }
        } catch (error) {
          console.error('Error processing data:', error);
          results.push({ isValid: false, message: `Error processing data: ${error.message}`, data });
        }
      })
      .on('end', async () => {
        console.log("Finished reading CSV. Starting validation...");
        for (const [slug, brandBody] of brandMap.entries()) {
          try {
            const brand = new Brand(brandBody);
            await brand.validate();
            console.log(`Brand ${slug} is valid.`);
            results.push({ isValid: true, message: `Brand "${slug}" is valid.`, data: brandBody });
          } catch (validationError) {
            console.error(`Brand ${slug} is invalid:`, validationError.message);
            results.push({ isValid: false, message: `Brand "${slug}" is invalid: ${validationError.message}`, data: brandBody });
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

const importBrands = async (validatedResults) => {
  const importSummary = [];
  for (const result of validatedResults) {
    if (result.isValid) {
      try {
        const brand = new Brand(result.data);
        await brand.save();
        importSummary.push({ isValid: true, message: `Brand "${result.data.slug}" imported successfully.`, data: result.data });
      } catch (error) {
        importSummary.push({ isValid: false, message: `Error importing brand "${result.data.slug}": ${error.message}`, data: result.data });
      }
    } else {
      importSummary.push(result);
    }
  }
  return importSummary;
};

module.exports = {
  createBrand,
  queryBrands,
  getBrandById,
  updateBrandById,
  deleteBrandById,
  validateBrands,
  importBrands
};
