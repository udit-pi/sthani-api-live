const mongoose = require('mongoose');
const { Schema } = mongoose;

const discountSchema = new Schema({
  discountType: {
    type: String,
    enum: ['ORDER_DISCOUNT', 'FREE_SHIPPING'],
    required: true,
  },
  code: {
    type: String,
    unique: true,
    match: /^[a-zA-Z0-9-_]+$/,
  },
  discountValue: {
    type: Number,
  },
  discountValueType: {
    type: String,
    enum: ['PERCENTAGE', 'AMOUNT'],
  },
  minimumPurchaseAmount: {
    type: Number,
    default: null,
  },
  limitToOneUse: {
    type: Boolean,
  },
 
startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  }, 
  startTime: {
    type: String, 
  },
  endTime: {
    type: String, 
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Expired'],
    default: 'Inactive',
  },
  used: {
    type: Number,
    default: 0,
  },
  usedBy: [{
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    name: String,
    email: String,
    usedDate: {
      type: Date,
      default: Date.now,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
  }],
});

const Discount = mongoose.model('Discount', discountSchema);

module.exports = Discount;
