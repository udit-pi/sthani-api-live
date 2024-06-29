const brandModel = require("../../models/brand.model");
const categoryModel = require("../../models/category.model");
const productModel = require("../../models/product.model");
const { filters, searchByKeyword } = require("../../services/store/filter.service");
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

    const products = await searchByKeyword(search_keyword);

    if (!products) {
        res.status(404).json("No Products found")
    }
    const filterProduct = filters(products, query)

    const productData = filterProduct.sortedProducts
    const pageNumber = filterProduct.page

    const uniqueBrands = new Map();

    productData.forEach(product => {
        if (product.brand_id && !uniqueBrands.has(product.brand_id.id)) {
            uniqueBrands.set(product.brand_id.id, {
                id: product.brand_id.id,
                name: product.brand_id.name,
                logo: product.brand_id.logo ? `${MEDIA_URL}${product.brand_id.logo}` : null
            });
        }
    });

    const brandsArray = Array.from(uniqueBrands.values());

    const response = {
        status: 200,
        message: 'Success',
        data: {

            brands: brandsArray,

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
                        amount: product.discounted_price ? product.discounted_price : product.price,
                        original_amount: product.price,
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




















