const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const generateSlug = require('../services/generateSlug');

const brandSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    logo: {
      type: String,
      required: false,
      trim: true,
    },
    slide_show :[{
      type: String, 
      required: true
    }],
    images: {
      type: [
        {
          label: {
            type: String,
            required: false,
          },
          value: {
            type: String,
            required: false,
          },
        },
      ],
      required: false,
    },
    website: {
      type: String,
      required: false,
      trim: true,
    },
    sort_order: {
      type: Number,
      default: 0
    },
  },
  {
    timestamps: true,
  }
);

brandSchema.pre('save', function(next) {
  if (!this.slug) {
      this.slug = generateSlug(this.name);
  }
  next();
});

// add plugin that converts mongoose to json
brandSchema.plugin(toJSON);
brandSchema.plugin(paginate);

module.exports = mongoose.model('Brand', brandSchema);









//"EXDEV: cross-device link not permitted, rename 'C:\\Users\\sumit\\AppData\\Local\\Temp\\59425e1791d9b372444b6a800' -> 'D:\\sthani\\api\\src\\uploads\\1714467803652cat.jpeg'"


