const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { ref } = require('joi');
const { Category } = require('.');

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: false,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // code: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },

    icon: {
      type: String,
      required: false,
      default: '',
      // trim: true,

    },
    is_featured: {
      type: Boolean,
      required: false,
      default: false,

    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    parent_category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },

    banner: {
      type: String,
      required: false,
      // trim: true,
      default: '',
    },
    slide_show: [{
      type: String,
      required: true
    }],

    meta_title: {
      type: String,
      required: false,
      trim: true,
    },
    meta_description: {
      type: String,
      required: false,
      trim: true,
    },
    deleted_at: {
      type: Date,
      default: Date.now,
      required: false
    },
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    tag: {
      type: String,
      required: false,
      trim: true,
    },
    sort_order: {
      type: Number,
      required: false,
      default: 0,
    },

  },
  {
    timestamps: true,
  }
);





// add plugin that converts mongoose to json
categorySchema.plugin(toJSON);
categorySchema.plugin(paginate);
categorySchema.set('validateBeforeSave', false);

module.exports = mongoose.model('Category', categorySchema);
