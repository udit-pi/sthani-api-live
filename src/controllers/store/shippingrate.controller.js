const ShippingRate = require('../../models/shippingrate.model');
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');

// Method to calculate shipping rate based on subtotal amount
exports.calculateShippingRate = async (req, res, next) => {
  const { subtotal } = req.body;

  if (subtotal === undefined || subtotal < 0) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid subtotal amount'));
  }

  try {
    const shippingRate = await ShippingRate.findOne({
      minValue: { $lte: subtotal },
      maxValue: { $gt: subtotal },
    });

    if (!shippingRate) {
      return next(new ApiError(httpStatus.NOT_FOUND, 'No shipping rate found for the given subtotal'));
    }

    res.status(200).json({ rate: shippingRate.rate });
  } catch (err) {
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error calculating shipping rate', true, err.stack));
  }
};
