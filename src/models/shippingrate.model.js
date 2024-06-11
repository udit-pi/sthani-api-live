const mongoose = require('mongoose');

const shippingRateSchema = new mongoose.Schema({
  minValue: {
    type: Number,
    required: true
  },
  maxValue: {
    type: Number,
    required: true,
    validate: {
      validator: function(value) {
        // Ensure the maxValue is greater than minValue
        return value > this.minValue;
      },
      message: props => `Maximum value (${props.value}) must be greater than minimum value`
    }
  },
  rate: {
    type: Number,
    required: true
  }
});

// unique compound index
shippingRateSchema.index({ minValue: 1, maxValue: 1 }, { unique: true });

const ShippingRate = mongoose.model('ShippingRate', shippingRateSchema);

module.exports = ShippingRate;
