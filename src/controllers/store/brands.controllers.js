const httpStatus = require('http-status');
const Brand = require('../../models/brand.model');
const Product = require('../../models/product.model');
const { filters } = require('../../services/store/filter.service');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');





const getFilterBrands=catchAsync(async(req,res)=>{
    const query = pick(req.query, ['sort', 'page']);
    const { brandsId } = req.params
    const { sort } = query;
    const filterData =req.body.filter 
    const brand = await Brand.findById(brandsId);
    if (!brand)throw new ApiError(httpStatus.NOT_FOUND, 'Brand is  not found');
    let productsQuery =await Product.find({ brand_id: brandsId });

    let FilterProducts= filters(productsQuery,query,filterData)

    const product = FilterProducts.sortedProducts
    const pageNumber = FilterProducts.page

console.log(product)
    const response = {
        status: 200,
        message: 'Success',
        data: {
           
            name:brand.name,
            banner:brand.banner,
            slideshow:brand.slide_show,
            description:brand.description,
           

            products: product.map(product => ({
                Product_id:product._id,
                name: product.name,
                image: product.image,
                short_description:product.description_short,
                  price:{
                    currency: "AED",
                    amount: product.price,
                    original_amount: product.price,
                    discount_percentage: product.discounted_price  
                }
              
            }))
        },
        meta: {
            current_page: pageNumber,
            total: product.length, 
            query_params: {
                sort,
                page: pageNumber
            }
        }
    };

    res.status(200).json(response)
})


// const getBrandsById=catchAsync(async(req,res)=>{


//     const query = pick(req.query, ['sort', 'page']);
//     const { brandsId } = req.params
//     const { sort } = query;
  
//     const brand = await Brand.findById(brandsId);
//     if (!brand)throw new ApiError(httpStatus.NOT_FOUND, 'Brand is  not found');
//     let productsQuery =await Product.find({ brand_id: brandsId });

//     let FilterProducts= filters(productsQuery,query)

//     const product = FilterProducts.sortedProducts
//     const pageNumber = FilterProducts.page


  
//     res.status(200).json(brand)




// })




module.exports={getFilterBrands}

















