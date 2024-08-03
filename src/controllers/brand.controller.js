const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { brandService } = require('../services');
const formidable = require('formidable');

const createBrand = catchAsync(async (req, res) => {
   
//   console.log(req.body)
//   console.log(req.files.logo[0].filepath)
try {
  const brand = await brandService.createBrand(req);
  res.status(httpStatus.CREATED).send(brand);
} catch (err) {
    res.status(400).json({ message: err.message });
}
   

});

const getBrands = catchAsync(async (req, res) => {

    const filter = pick(req.query, ['name', 'role']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await brandService.queryBrands(filter, options);
    console.log(result)
    res.send(result);

})

const getBrand = catchAsync(async (req, res) => {
    const brand = await brandService.getBrandById(req.params.brandId);
    if (!brand) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Brand not found');
    }
    res.send(brand);
  });

  const updateBrand = catchAsync(async (req, res) => {
   
    const brand = await brandService.updateBrandById(req.params.brandId, req);
   
    res.send(brand);
  });

  const deleteBrand = catchAsync(async (req, res) => {
    // to work on deleting files
await brandService.deleteBrandById(req.params.brandId);
res.status(httpStatus.NO_CONTENT).json({'message': 'Brand deleted successfully'});
});

  
const validateAndImportBrands = catchAsync(async (req, res) => {
  try {
    if (req.files && req.files.file) {
      const file = req.files.file;
      const shouldImport = req.path.includes('import');

      const results = await brandService.validateBrands(file);
      const isValid = results.every(result => result.isValid);

      if (!shouldImport) {
        return res.status(200).json({ validationResults: results, isValid });
      }

      if (isValid) {
        const importSummary = await brandService.importBrands(results);
        return res.status(200).json({ importSummary });
      } else {
        return res.status(400).json({ validationResults: results, isValid });
      }
    } else {
      return res.status(400).json({ message: 'No file uploaded' });
    }
  } catch (error) {
    console.error('Error during validation/import:', error);
    return res.status(500).json({ message: 'Error during validation/import', error: error.message });
  }
});

module.exports = {
    createBrand,
    getBrands,
    getBrand,
    updateBrand,
    deleteBrand,
    validateAndImportBrands
}