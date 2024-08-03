const httpStatus = require('http-status');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Category } = require('../models');
const ApiError = require('../utils/ApiError');
const generateSlug = require('./generateSlug');
const { uploadSingleFile, uploadMultipleFile } = require('./fileUpload.service');
const uploadFolder = process.env.UPLOAD_FOLDER || '/var/www/html/media';


const createCategory = async (req) => {
  console.log("Hello file", req.files['slide_show[]'])
  if (req.files.banner) {

    var banner = uploadSingleFile(req.files.banner)
  }
  if (req.files.icon) {

    var icon = uploadSingleFile(req.files.icon)
  }
  if (req.files['slide_show[]']) {
    var slide_show = uploadMultipleFile(req.files['slide_show[]'])
  }
  if (slide_show) {

    var slideShowValues = slide_show.map(item => item.value);
  }
  // console.log(slideShowValues)
  const slug = generateSlug(req.body.name);

  const category = new Category({
    name: req.body.name,
    // code: req.body.code,
    banner: banner && banner,
    icon: icon && icon,
    slide_show: slideShowValues,
    description: req.body.description,
    parent_category: req.body.parent_category,
    meta_title: req.body.meta_title,
    meta_description: req.body.meta_description,
    slug: slug,
    is_featured: req.body.is_featured,
    tag: req.body.tag,
    sort_order: req.body.sort_order,

  })
  const newCategory = category.save()
  return newCategory;

};


const queryCategories = async (filter, options) => {
  //   const categories = await Category.paginate(filter, options);
  return Category.find().sort({ updatedAt: -1 });
};


const getCategoryById = async (id) => {
  return Category.findById(id);
};



const updateCategoryById = async (req, categoryId, updateBody) => {
  console.log("Updated", updateBody)
  console.log("categryId", categoryId)
  console.log(req.files)

  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }


  if (req.files.banner && Object.keys(req.files.banner).length !== 0 && typeof req.files.banner === 'object') {
    console.log(req.files);
    const banner = uploadSingleFile(req.files.banner)
    category.banner = banner;
  } else {
    updateBody.banner = category.banner
  }

  if (req.files.icon && Object.keys(req.files.icon).length !== 0 && typeof req.files.icon === 'object') {
    console.log(req.files);
    const icon = uploadSingleFile(req.files.icon)
    category.icon = icon;
  } else {
    updateBody.icon = category.icon
  }

  var length = 0


  if (!updateBody.slide_show) {
    category.slide_show = []
  }

  // console.log( "hello length",req.files.slide_show.length)

  if (req.files['slide_show[]']) {
    var slide_showImage = uploadMultipleFile(req.files['slide_show[]']);
    var slideShowValues = slide_showImage.map(item => item.value);
    // Check if slide_show array exists in updateBody
    if (!updateBody.slide_show || !Array.isArray(updateBody.slide_show)) {
      updateBody.slide_show = []; // Initialize slide_show as an array if it doesn't exist
    }

    // Add the new slide_showImage to the slide_show array



    // updateBody.slide_show.push(slideShowValues);
    //  updateBody.slide_show=slideShowValues
    updateBody.slide_show = [...updateBody.slide_show, ...slideShowValues];
  }

  // else{
  //   updateBody.slide_show = [...updateBody.slide_show]
  // }




  Object.assign(category, updateBody);

  console.log("--------------------", category)




  await category.save();

  return category;
};


const deleteCategoryById = async (categoryId) => {
  const category = await getCategoryById(categoryId);

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  const imageName = category.banner;
  const iconName = category.icon;
  // Construct the path to the image file

  const imagePath = imageName && path.join(uploadFolder, imageName);
  const iconPath = iconName && path.join(uploadFolder, iconName);


  // Delete the image file from the file system
  if (imagePath) {


    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error('Error deleting image:', err);
        return res.status(500).json({ error: 'Failed to delete image' });
      }
    })
  }
  if (iconPath) {


    fs.unlink(iconPath, (err) => {
      if (err) {
        console.error('Error deleting icon:', err);
        return res.status(500).json({ error: 'Failed to delete icon' });
      }
    })
  }
  await category.remove();
  return category;
};

const validateAndImportCategories = async (file, shouldImport) => {
  const results = [];
  const categoryMap = new Map();

  const fileName = Date.now() + '-' + file.originalFilename;
  const filePath = path.join(uploadFolder, fileName);

  const tempFilePath = file.filepath;

  try {
    await fs.promises.rename(tempFilePath, filePath);
  } catch (error) {
    console.error('Error moving file:', error);
    throw error;
  }

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const cleanedData = {};
        for (const key in data) {
          const cleanedKey = key.replace(/^\uFEFF/, ''); // Remove any BOM character from the key
          cleanedData[cleanedKey] = data[key];
        }

        console.log("Cleaned CSV Row Data:", cleanedData);

        try {
          const categoryBody = {
            slug: cleanedData['Slug'],
            name: cleanedData['Name'],
            description: cleanedData['Description'],
            icon: cleanedData['Icon'] || '',
            is_featured: cleanedData['Is Featured'] === 'TRUE',
            banner: cleanedData['Banner'] || '',
            slide_show: cleanedData['Slideshow'] ? cleanedData['Slideshow'].split(', ') : [],
            meta_title: cleanedData['Meta Title'] || '',
            meta_description: cleanedData['Meta Description'] || '',
            tag: cleanedData['Tag'] || '',
            sort_order: parseInt(cleanedData['Sort Order'], 10) || 0,
            parent_category: cleanedData['Parent Category'] || null,
          };
          console.log("CategoryBody", categoryBody);
          categoryMap.set(cleanedData['Slug'], categoryBody);
        } catch (error) {
          console.error('Error processing data:', error);
          results.push({ isValid: false, message: `Error processing data: ${error.message}`, data });
        }
      })
      .on('end', async () => {
        console.log("Finished reading CSV. Starting validation...");

        for (const [slug, categoryBody] of categoryMap.entries()) {
          try {
            if (categoryBody.parent_category) {
              const parentCategory = await Category.findOne({ slug: categoryBody.parent_category });
              categoryBody.parent_category = parentCategory ? parentCategory.id : null;
            }
            
            const category = new Category(categoryBody);
            await category.validate();

            if (shouldImport) {
              await category.save();
            }

            results.push({ isValid: true, message: `Category "${slug}" is valid.`, data: categoryBody });
          } catch (validationError) {
            console.error(`Category ${slug} is invalid:`, validationError.message);
            results.push({ isValid: false, message: `Category "${slug}" is invalid: ${validationError.message}`, data: categoryBody });
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
  createCategory,
  queryCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
  validateAndImportCategories

};
