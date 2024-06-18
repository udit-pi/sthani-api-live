const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const Schema = mongoose.Schema;

const orderItemSchema = mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    discounted_price: {
      type: Number,
      required: false,
    },
    total: {
      type: Number,
      required: true,
    },
    variant: {
      _id: mongoose.Schema.Types.ObjectId,
      name: {
        type: String,
        required: false,
      },
      price: {
        type: Number,
        required: false,
      },
      discounted_price: {
        type: Number,
        required: false,
      },
      sku: {
        type: String,
        required: false,
        default: "",
      },
      image: {
        type: String,
        required: false,
      },
    },
  },
  { _id: false }
);

const orderSchema = mongoose.Schema(
  {
    customer: {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: false,
      },
      mobile: {
        type: String,
        required: false,
      },
    },
    address: {
      name: String,
      mobile: String,
      address_line: String,
      city: String,
      state: String,
      postal_code: String,
      landmark: String,
      address_type: { type: String, enum: ['Home', 'Office'] },
    },
    items: [orderItemSchema],
    currency: {
      type: String,
      required: true,
      default: "AED"
    },
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      code: {
        type: String,
      },
      amount: {
        type: Number,
      },
    },
    shipping: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    orderStatus: {
      type: String,
      enum: ['Unfulfilled', 'Fulfilled', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Unfulfilled',
    },
    transactionId: { 
      type: String, 
      required: false 
    },
    paymentErrorMessage: { 
      type: String, 
      required: false 
    },
    paymentMethod: {
      type: String,
      required: false,
    },
    paymentDetails: {
      type: Schema.Types.Mixed, // Allows any data type
      required: false
    },
    transactionStatus: { type: String, required: false },
    paymentErrors: {
      code: { type: String, required: false },
      message: { type: String, required: false },
    },
    shipmentDetails: {
      trackingNumber: {
        type: String, 
        required: false,
      },
      shippingCompany: {
        type: String,
        required: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre('find', function() {
  // Apply default sorting by createdAt in descending order
  this.sort({ createdAt: -1 });
});

orderSchema.index({ customerId: 1, paymentStatus: 1, orderStatus: 1 });

// Custom validation to ensure either email or mobile is present
orderSchema.pre('validate', function (next) {
  if (!this.customer.email && !this.customer.mobile) {
    this.invalidate('customer.email', 'Either email or mobile must be present.');
    this.invalidate('customer.mobile', 'Either email or mobile must be present.');
  }
  next();
});

// add plugin that converts mongoose to json
orderSchema.plugin(toJSON);
orderSchema.plugin(paginate);

module.exports = mongoose.model('Order', orderSchema);
