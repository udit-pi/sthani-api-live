const brandModel = require("../../models/brand.model");
const categoryModel = require("../../models/category.model");
const productModel = require("../../models/product.model");
const { filters } = require("../../services/store/filter.service");
const catchAsync = require("../../utils/catchAsync");
const pick = require("../../utils/pick");











const getSearch=catchAsync(async(req,res)=>{
    const query = pick(req.query, ['sort', 'page']);
const{search_keyword}=req.body
const { sort } = query;
if (!search_keyword) {
    return res.status(400).send({ message: 'Search keyword is required' });
}

//main product which i want to search


const productQuery = {
    name: { $regex: search_keyword, $options: 'i' }
};
  // Search for products by brand name
  const brands = await brandModel.find({ name: { $regex: search_keyword, $options: 'i' } });
  const brandIds = brands.map(brand => brand._id);
  const brandQuery = {
      brand_id: { $in: brandIds }
  };


//seacrh for category also
  const categories = await categoryModel.find({ name: { $regex: search_keyword, $options: 'i' } });
  const categoryIds = categories.map(category => category._id);
  const categoryQuery = {
      categories: { $in: categoryIds}
  };


  //combine all the query 
  //among 3 any seacrh work 

   
  const combinedQuery = {
    $or: [productQuery, brandQuery, categoryQuery]
};


const products = await productModel.find(combinedQuery).populate('brand_id')


const filterProduct=filters(products,query)

const product = filterProduct.sortedProducts
const pageNumber = filterProduct.page


  




const response = {
    status: 200,
    message: 'Success',
    data: {

        brands:product.map(product=>({
id:product.brand_id.id,
name:product.brand_id.name,
logo:product.brand_id.logo
        })),
        products: product.map(product => ({
            Product_id:product._id,
            name: product.name,
            description_short: product.description_short,
            image: product.image,
            price: product.price,
            price_discounted: product.discounted_price,

        }))
    },
    meta: {
        current_page: pageNumber,
        total: product.length, 
        search_keyword:search_keyword,
        query_params: {
            sort,
            page: pageNumber
        }
    }
};


res.status(200).json(response)
})

module.exports={getSearch}




















