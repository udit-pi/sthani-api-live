const Product = require('../models/product.model');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const uploadFolder = process.env.UPLOAD_FOLDER || '/var/www/html/media/csv';

// Get all products and their variants
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().select('_id name sku stock product_variants');
    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      sku: product.sku,
      stock: product.stock,
      image: product.image,
      product_variants: product.product_variants.map(variant => ({
        _id: variant._id,
        name: variant.name,
        sku: variant.sku,
        stock: variant.stock,
      }))
    }));
    res.status(200).json(formattedProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update stock for a product or variant
exports.updateStock = async (req, res) => {
  const { productId, variantId, stock } = req.body;

  try {
    if (variantId) {
      await Product.updateOne(
        { _id: productId, 'product_variants._id': variantId },
        { $set: { 'product_variants.$.stock': stock } }
      );
    } else {
      await Product.updateOne(
        { _id: productId },
        { $set: { stock: stock } }
      );
    }
    res.status(200).json({ message: 'Stock updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Bulk update stock from CSV
exports.bulkUpdateStock = async (req, res) => {
  const uploadSingleFile = (file) => {
    const fileName = Date.now() + '-' + file.originalname;
    const filePath = path.join(uploadFolder, fileName);
    fs.renameSync(file.filepath, filePath); // Move file to desired location
    return filePath;
  };

  try {
    const file = req.files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = uploadSingleFile(file);

    const results = [];
    let updatedCount = 0;
    let notFoundCount = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (let row of results) {
          // Clean the keys
          row = Object.keys(row).reduce((cleanedRow, key) => {
            const cleanKey = key.replace(/^\uFEFF/, ''); // Remove BOM if present
            cleanedRow[cleanKey] = row[key];
            return cleanedRow;
          }, {});

          const { productId, variantId, stock } = row;

          if (variantId) {
            const updateResult = await Product.updateOne(
              { _id: productId, 'product_variants._id': variantId },
              { $set: { 'product_variants.$.stock': stock } }
            );
            if (updateResult.nModified > 0) {
              updatedCount++;
            } else {
              notFoundCount++;
            }
          } else {
            const updateResult = await Product.updateOne(
              { _id: productId },
              { $set: { stock: stock } }
            );
            if (updateResult.nModified > 0) {
              updatedCount++;
            } else {
              notFoundCount++;
            }
          }
        }
        res.status(200).json({ message: `Stock updated successfully. ${updatedCount} records updated, ${notFoundCount} records not found.` });
      })
      .on('error', (error) => {
        res.status(500).json({ error: error.message });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
