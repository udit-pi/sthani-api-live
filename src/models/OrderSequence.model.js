// models/OrderSequence.model.js

const mongoose = require('mongoose');

const orderSequenceSchema = new mongoose.Schema({
  current: {
    type: Number,
    default: 10000000, // Starting point for your sequence
  },
});

const OrderSequence = mongoose.model('OrderSequence', orderSequenceSchema);

module.exports = OrderSequence;
