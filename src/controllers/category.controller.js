const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const path = require('path');
const fs = require('fs');
const catchAsync = require('../utils/catchAsync');
const { categoryService } = require('../services');
const uploadFolder = process.env.UPLOAD_FOLDER || '/var/www/html/media';

const createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req);
  res.status(httpStatus.CREATED).send(category);
});

const getCategories = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await categoryService.queryCategories(filter, options);
  console.log("categories", result);
  res.send(result);
});

const getCategory = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  res.send(category);
});

const updateCategory = catchAsync(async (req, res) => {
    // to work on updating files
    // console.log(req.body);
  const category = await categoryService.updateCategoryById(req,req.params.categoryId, req.body);
  res.send(category);
});

const deleteCategory = catchAsync(async (req, res) => {
       // to work on deleting files
  await categoryService.deleteCategoryById(req.params.categoryId);
  res.status(httpStatus.NO_CONTENT).json({'message': 'Category deleted successfully'});
});

const validateAndImportCategories = catchAsync(async (req, res) => {
  try {
    if (req.files && req.files.file) {
      const file = req.files.file;
      const shouldImport = req.path.includes('import');

      const results = await categoryService.validateAndImportCategories(file, shouldImport);
      const isValid = results.every(result => result.isValid);
      //console.log("Results", results);
      if (!shouldImport) {
        res.status(200).json({ validationResults: results, isValid });
      } else {
        res.status(200).json({ importSummary: results });
      }

      // Clean up the uploaded file after validation
      const filePath = path.join(uploadFolder, Date.now() + '-' + file.originalFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else {
      res.status(400).json({ message: 'No file uploaded' });
    }
  } catch (error) {
    console.error('Error during validation/import:', error);
    res.status(500).json({ message: 'Error during validation/import', error: error.message });
  }
});

module.exports = {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
    validateAndImportCategories
};
