const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const generateSlug = require("../services/generateSlug");

const homeSchema = mongoose.Schema(
  {
    placement_id: {
      type: String,
      required: true,
      //   unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      required: false,
      trim: true,
    },
    widget_type: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [   
        {
          _id: false,
          image: {
            type: String,
            required: false,
          },
          description: {
            type: String,
            required: false,
          },
          tag: {
            type: String,
            required: false,
          },

          destination: {
            type: String,
            required: false,
          },
          id: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
          },
          brand: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
          },
          category: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
          },
          product: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
          },
          products: {
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
                  _id: false,
                },
          ],
          required: false
          }
        },
      ],
    },
    is_active: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
homeSchema.plugin(toJSON);
homeSchema.plugin(paginate);

module.exports = mongoose.model("Home", homeSchema);
