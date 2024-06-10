const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const generateSlug = require("../services/generateSlug");
const { required } = require("joi");

const productSchema = mongoose.Schema(
  {
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: false
  },
    sku: {
      type: String,
      required: false,
      unique: false,
      default: ""
     
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    description_short: {
      type: String,
      required: false,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
   
    weight: {
      type: Number,
      required: false,
    },
    length: {
      type: Number,
      required: false,
    },
    width: {
      type: Number,
      required: false,
    },
    height: {
      type: Number,
      required: false,
    },
   
    quantity_min: {
      type: Number,
      default: 1,
    },
   
    stock: {
      type: Number,
      default: 0,
    },
  
    price: {
      type: Number,
      required: true,
    },
    discounted_price: {
      type: Number,
      required: false,
    },
   
    cost: {
      type: Number,
      required: false,
    },
    media: {
      type: [String], 
      required: true
    },
    published: {
      type: Boolean,
      default: 0
  },
 
    deleted_at: {
      type: Date,
      default: Date.now,
      required: false,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    
    product_variants: {
      type: [
        {
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
          stock: {
            type: Number,
            required: false,
          },
          sku: {
            type: String,
            required: false,
            default: ""
          },

          image: {
            type: String,
            required: false,
          },
        },
      ],
      required: false,
    },
    additional_descriptions: {
      required:false,
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
    },
    options: {
      required:false,
      type: [
        {
          optionName: {
            type: String,
            required: false,
          },
          options: {
            type: [
              {
                value: {
                  type: String,
                  required: false,
                },
              },
            ],
          },
        },
      ],
    },
  
 },
  
  {
    timestamps: true,
  }
);

productSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = generateSlug(this.name);
  }
  next();
});

// add plugin that converts mongoose to json
productSchema.plugin(toJSON);
productSchema.plugin(paginate);

module.exports = mongoose.model("Product", productSchema);
