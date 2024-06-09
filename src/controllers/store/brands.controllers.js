const httpStatus = require('http-status');
const Brand = require('../../models/brand.model');
const Product = require('../../models/product.model');
const { filters } = require('../../services/store/filter.service');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const MEDIA_URL = process.env.MEDIA_URL;




const getFilterBrands=catchAsync(async(req,res)=>{
    const query = pick(req.query, ['sort', 'page']);
    const { brandsId } = req.params
    const { sort } = query;
    const filterData =req.body.filter 
    const brand = await Brand.findById(brandsId);
    if (!brand)throw new ApiError(httpStatus.NOT_FOUND, 'Brand is  not found');
    let productsQuery =await Product.find({ brand_id: brandsId });

    let FilterProducts= filters(productsQuery,query,filterData)

    const products = FilterProducts.sortedProducts
    const pageNumber = FilterProducts.page

    const productSlideshow = brand.slide_show.map(image => MEDIA_URL + image);
    // if (product && Array.isArray(product[0].media)) {
    //     // Map over the array of filenames and concatenate MEDIA_URL with each filename
    //     var productImage = product[0].media.map(filename => MEDIA_URL + filename);
    //     console.log("Hello", productImage);
    //   } else {
    //     console.log("Product media is not defined or not an array");
    //   }
// console.log( "hello", product)
console.log(brand);

let brand_images;
if (brand.images && brand.images.length > 0) {
     brand_images = brand.images.reduce((acc, img) => {
        acc[img.label] = `${MEDIA_URL}${img.value}`;
        return acc;
    }, {});

    console.log(brand_images);
}

    const response = {
        status: 200,
        message: 'Success',
        data: {
           
            name:brand.name,
            banner:brand.banner,
            slideshow:productSlideshow,
            description:brand.description,
            brand_logo:`${MEDIA_URL}${brand.logo}`,
           

            products: products.map(product => {
                const productImages = product.media ? product.media.map(filename => MEDIA_URL + filename) : [];

                return {
                Product_id:product._id,
                name: product.name,
                image: productImages,
                short_description: product.description_short,
                  price:{
                    currency: "AED",
                    amount: product.price,
                    original_amount: product.discounted_price,
                    discount_percentage: product.discounted_price ? Math.round(((product.price - product.discounted_price) / product.price) * 100) : 0 
                }
            };
              
            })
        },
        meta: {
            current_page: pageNumber,
            total: products.length, 
            query_params: {
                sort,
                page: pageNumber
            }
        }
    };

    if (brand_images) {
        Object.assign(response.data, brand_images);
    }
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

















