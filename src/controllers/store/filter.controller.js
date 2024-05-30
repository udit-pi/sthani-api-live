const Brand = require('../../models/brand.model');
const Category = require('../../models/category.model');
const Product = require('../../models/product.model');
const ApiError = require("../../utils/ApiError");
const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");


const Filters = catchAsync(async (req, res) => {

const {pagetype,id}=req.params



var productsQuery
if(pagetype=="category"){
    var category = await Category.findById(id);
    if (!category)throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  productsQuery =await Product.find({ categories: id});
}
if(pagetype=="brand"){
    var brand = await Brand.findById(id);
    if (!brand)throw new ApiError(httpStatus.NOT_FOUND, 'Brand is  not found');
   productsQuery =await Product.find({ brand_id: id });
}
const categoryIds = [...new Set(productsQuery.flatMap(product => product.categories))];
const brandIds = [...new Set(productsQuery.map(product => product.brand_id))];


// Fetch category names
const categories = await Category.find({ _id: { $in: categoryIds } }, 'name').lean();
const categoryResponse = categories.map(category => ({ id: category._id, name: category.name }));

    // Fetch brand names
const brands = await Brand.find({ _id: { $in: brandIds } }, 'name').lean();
const brandResponse = brands.map(brand => ({ id: brand._id, name: brand.name }));


const prices = productsQuery.map(product => product.price);
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);



const response = {
    status: 200,
    message: 'Success',
    data: {

        sort: [
            { id: "relevance", "name": "Relevance" },
            { id: "new", "name": "What's New" },
            { id: "price_high_to_low", "name": "Price: High to Low" },
            { id: "price_low_to_high", "name": "Price: Low to High" },
            { id: "discounted", "name": "Discounted" }
          ],
       
brands:brandResponse,
categories: categoryResponse,
price: {
    min: minPrice,
    max: maxPrice
}

},
};


res.status(200).json(response)




})

module.exports={Filters}