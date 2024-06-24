const brandModel = require("../../models/brand.model");
const categoryModel = require("../../models/category.model");
const productModel = require("../../models/product.model");
const { filters } = require("../../services/store/filter.service");
const catchAsync = require("../../utils/catchAsync");
const pick = require("../../utils/pick");
const MEDIA_URL = process.env.MEDIA_URL;










const getSearch = catchAsync(async (req, res) => {
    const query = pick(req.query, ['sort', 'page']);
    const { search_keyword } = req.body
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
        categories: { $in: categoryIds }
    };


    //combine all the query 
    //among 3 any seacrh work 


    const combinedQuery = {
        $or: [productQuery, brandQuery, categoryQuery]
    };


    const products = await productModel.find(combinedQuery).populate('brand_id')


    const filterProduct = filters(products, query)

    const productData = filterProduct.sortedProducts
    const pageNumber = filterProduct.page







    const response = {
        status: 200,
        message: 'Success',
        data: {

            brands: productData.map(product => ({
                id: product.brand_id.id,
                name: product.brand_id.name,
                logo: product.brand_id.logo && `${MEDIA_URL}${product.brand_id.logo}`
            })),

            products: productData.map(product => {
                const productImages = product.media ? product.media.map(filename => filename && MEDIA_URL + filename) : [];

                return {
                    Product_id: product._id,
                    name: product.name,
                    short_description: product.description_short,
                    image: productImages,

                    brand: {
                        brand_id: product.brand_id.id,
                        name: product.brand_id.name,
                        logo: product.brand_id.logo && `${MEDIA_URL}${product.brand_id.logo}`

                    },
                    price: {
                        currency: "AED",
                        amount: product.discounted_price ? product.discounted_price: product.price,
                        original_amount: product.price ,
                        discount_percentage: product.discounted_price ? Math.round(((product.price - product.discounted_price) / product.price) * 100) : 0
                    }
                }; // return
            })

            
            // products: product.map(product => ({
            //     Product_id: product._id,
            //     name: product.name,
            //     description_short: product.description_short,
            //     image: product.image,
            //     price: product.price,
            //     price_discounted: product.discounted_price,

            // })) 
        },
        meta: {
            current_page: pageNumber,
            total: productData.length,
            search_keyword: search_keyword,
            query_params: {
                sort,
                page: pageNumber
            }
        }
    };


    res.status(200).json(response)
})

module.exports = { getSearch }




















