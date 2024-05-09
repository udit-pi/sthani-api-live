const httpStatus = require('http-status');
const fs = require('fs');
const path = require('path');
const { Category } = require('../models');
const ApiError = require('../utils/ApiError');
const generateSlug = require('./generateSlug');
const { uploadSingleFile, uploadMultipleFile } = require('./fileUpload.service');


const createCategory = async (req) => {
  console.log( "Hello file", req.files['slide_show[]'])
  if(req.files.banner){

  var banner = uploadSingleFile(req.files.banner)
  }
  if(req.files.icon){

    var icon = uploadSingleFile(req.files.icon)
  }
  if(req.files['slide_show[]']){
    var slide_show = uploadMultipleFile(req.files['slide_show[]'])
  }
  if(slide_show){

    var slideShowValues = slide_show.map(item => item.value);
  }
  // console.log(slideShowValues)
const slug = generateSlug(req.body.name);
   
    const category = new Category({
      name: req.body.name,
      // code: req.body.code,
      banner:banner&& banner,
      icon: icon && icon,
      slide_show:slideShowValues,
      description:req.body.description,
      parent_category:req.body.parent_category,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      slug: slug
      
    })
    const newCategory = category.save()
    return newCategory;
    
};


const queryCategories = async (filter, options) => {
//   const categories = await Category.paginate(filter, options);
  return Category.find();
};


const getCategoryById = async (id) => {
  return Category.findById(id);
};



const updateCategoryById = async (req,categoryId, updateBody) => {
   console.log( "Updated", updateBody)
  console.log( "categryId",categoryId)
  console.log(req.files)
 
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }


  if(req.files.banner&& Object.keys(req.files.banner).length !== 0 && typeof req.files.banner === 'object') {
    console.log(req.files);
    const banner = uploadSingleFile(req.files.banner)
    category.banner =  banner;
  } else {
    updateBody.banner = category.banner
  }

  if(req.files.icon&& Object.keys(req.files.icon).length !== 0 && typeof req.files.icon === 'object') {
    console.log(req.files);
    const icon = uploadSingleFile(req.files.icon)
    category.icon =  icon;
  } else {
    updateBody.icon = category.icon
  }

 

  if (req.files['slide_show[]']) {
   

    var slide_showImage = uploadSingleFile(req.files['slide_show[]']);
    
    // Check if slide_show array exists in updateBody
    if (!updateBody.slide_show || !Array.isArray(updateBody.slide_show)) {
        updateBody.slide_show = []; // Initialize slide_show as an array if it doesn't exist
    }

    // Add the new slide_showImage to the slide_show array
    updateBody.slide_show.push(slide_showImage);
}

if(!updateBody.slide_show){
  category.slide_show=[]
}    
    
    
    
    
    Object.assign(category, updateBody);
    
    console.log(category)
   
 
 
  
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

  const imagePath =imageName&& path.join(__dirname, '../uploads', imageName);
  const iconPath =iconName&& path.join(__dirname, '../uploads', iconName);


  // Delete the image file from the file system
  if(imagePath){

  
  fs.unlink(imagePath, (err) => {
    if (err) {
      console.error('Error deleting image:', err);
      return res.status(500).json({ error: 'Failed to delete image' });
    }
  })
}
if(iconPath){


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


module.exports = {
    createCategory,
    queryCategories,
    getCategoryById,
    updateCategoryById,
    deleteCategoryById,
  
};
