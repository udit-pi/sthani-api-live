const ShippingRate = require('../models/shippingrate.model');
const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

async function checkForOverlappingRanges(minValue, maxValue, excludeId = null) {
    // Check for any rate that overlaps or touches the boundaries of the new range
    const overlapCondition = {
      $or: [
        // Condition where existing ranges start inside the new range
        { minValue: { $lt: maxValue }, maxValue: { $gt: minValue } },
        // Condition where existing ranges end inside the new range
        { minValue: { $lt: maxValue }, maxValue: { $gt: minValue } },
        // New condition to prevent boundary touching
        { minValue: { $lte: maxValue }, maxValue: { $gte: minValue } }
      ]
    };
  
    if (excludeId) {
      // Exclude the current document when checking for updates
      overlapCondition['_id'] = { $ne: excludeId };
    }
  
    const existingRate = await ShippingRate.findOne(overlapCondition);
    return existingRate != null;
  }


// Get all shipping rates
exports.getShippingRates = async (req, res) => {
    try {
        const rates = await ShippingRate.find({});
        res.json(rates);
    } catch (err) {
        res.status(500).send({ message: 'Error retrieving shipping rates', error: err });
    }
};

// Get a single shipping rate by id
exports.getShippingRate = async (req, res) => {
    try {
        const rate = await ShippingRate.findById(req.params.rateId);
        if (!rate) {
            return res.status(404).send({ message: 'Shipping rate not found' });
        }
        res.json(rate);
    } catch (err) {
        res.status(500).send({ message: 'Error retrieving shipping rate', error: err });
    }
};


// Create a new shipping rate
exports.createShippingRate = catchAsync( async (req, res, next) => {
    const { minValue, maxValue, rate } = req.body;
    if (minValue >= maxValue) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'Minimum value must be less than maximum value'));
    }
  
    const hasOverlap = await checkForOverlappingRanges(minValue, maxValue);
    if (hasOverlap) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'This shipping rate range overlaps with an existing range'));
    }
  
    const newRate = new ShippingRate({ minValue, maxValue, rate });
  
    try {
      const savedRate = await newRate.save();
      res.status(201).json(savedRate);
    } catch (err) {
      next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating shipping rate', true, err.stack));
    }
  });

// const updateProduct = catchAsync(async (req, res) => {

  
//     try {
  
//       const product = await productService.saveProduct( req.body, req, req.params.productId);
  
//       if (product) {
//         return res.status(200).json({ status: 200, message: 'Product updated successfully!' });
//       } else {
//         return res.status(400).json({ status: 400, message: 'Error creating product' });
//       }
  
  
//     } catch (err) {
//       res.status(400).json({ message: err.message });
//     }
   
//   });

  

// Update a shipping rate
exports.updateShippingRate = async (req, res) => {
    const { minValue, maxValue, rate } = req.body;
    if (minValue !== undefined && maxValue !== undefined && minValue >= maxValue) {
        return res.status(400).send({ message: 'Minimum value must be less than maximum value' });
    }

    const hasOverlap = await checkForOverlappingRanges(minValue, maxValue, req.params.rateId);
    if (hasOverlap) {
        return res.status(400).send({ message: 'This shipping rate range overlaps with an existing range' });
    }

    try {
        const rate = await ShippingRate.findByIdAndUpdate(req.params.rateId, { minValue, maxValue, rate }, { new: true, runValidators: true });
        if (!rate) {
            return res.status(404).send({ message: 'Shipping rate not found' });
        }
        res.json(rate);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).send({ message: 'A shipping rate with the same minimum and maximum values already exists' });
        }
        res.status(500).send({ message: 'Error updating shipping rate', error: err.message });
    }
};


// Delete a shipping rate
exports.deleteShippingRate = async (req, res) => {
    try {
        const rate = await ShippingRate.findByIdAndDelete(req.params.rateId);
        if (!rate) {
            return res.status(404).send({ message: 'Shipping rate not found' });
        }
        res.status(204).send();
    } catch (err) {
        res.status(500).send({ message: 'Error deleting shipping rate', error: err });
    }
};


