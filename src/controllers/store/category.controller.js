
const catchAsync = require("../../utils/catchAsync");
const pick = require("../../utils/pick");
const Category = require('../../models/category.model');
const Product = require('../../models/product.model');
const ApiError = require("../../utils/ApiError");
const httpStatus = require("http-status");
const { filters } = require("../../services/store/filter.service");
const mongoose = require('mongoose');
const MEDIA_URL = process.env.MEDIA_URL;

const getFiltercategory = catchAsync(async (req, res) => {


    console.log("Params: ", req.params);
    const { categoryId } = req.params;
    console.log("Category: ", categoryId);

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid categoryId');
    }

    const categoryIdObject = mongoose.Types.ObjectId(categoryId);
    console.log("Category Obj: ", categoryIdObject);
    const category = await Category.findById(categoryId).populate({
        path: 'parent_category',
        select: '_id name icon'
    });


    console.log("Category data: ", category);


    if (!category) throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');

    const subCategories = await Category.find({ parent_category: categoryIdObject }).select('_id name icon');


    let productsQuery = await Product.find({ categories: categoryIdObject }).populate({
        path: 'brand_id',
    });

    const filterData = req.body.filters
    const query = pick(req.query, ['sort', 'page']);
    const { sort } = query;

    let FilterProducts = filters(productsQuery, query, filterData)
    const products = FilterProducts.sortedProducts
    const pageNumber = FilterProducts.page



    // if (product && Array.isArray(product[0].media)) {
    //     // Map over the array of filenames and concatenate MEDIA_URL with each filename
    //     var productImage = product[0].media.map(filename => MEDIA_URL + filename);

    // } else {
    //     console.log("Product media is not defined or not an array");
    // }
    const CategorySlideshow = category.slide_show.map(image => MEDIA_URL + image);

    const response = {
        status: 200,
        message: 'Success',
        data: {
            name: category.name,
            banner: `${MEDIA_URL}${category.banner}`,
            slideshow: CategorySlideshow,
            description: category.description,
            sub_categories: subCategories.map(subCat => ({
                id: subCat._id.toString(),
                name: subCat.name,
                icon: subCat.icon ? `${MEDIA_URL}${subCat.icon}` : null
            })),



            products: products.map(product => {
                const productImages = product.media ? product.media.map(filename => MEDIA_URL + filename) : [];
                const productVariants = product.product_variants && Array.isArray(product.product_variants) ? product.product_variants.map(variant => ({
                    variant_id: variant._id,
                    name: variant.name,
                    price: variant.price,
                    discounted_price: variant.discounted_price,
                    discount_percentage: variant.discounted_price ? Math.round(((variant.price - variant.discounted_price) / variant.price) * 100) : 0,
                    stock: variant.stock,
                    sku: variant.sku,
                    image: variant.image ? `${MEDIA_URL}${variant.image}` : "",  // Prepend MEDIA_URL if image exists
                })) : [];

                return {
                    Product_id: product._id,
                    name: product.name,
                    short_description: product.description_short,
                    image: productImages,

                    brand: {
                        brand_id: product.brand_id.id,
                        name: product.brand_id.name,
                        logo: `${MEDIA_URL}${product.brand_id.logo}`

                    },
                    price: {
                        currency: "AED",
                        amount: product.discounted_price ? product.discounted_price: product.price,
                        original_amount: product.price,
                        discount_percentage: product.discounted_price ? Math.round(((product.price - product.discounted_price) / product.price) * 100) : 0
                    },
                    tags: product.productTags || [],
                    variants: productVariants,

                }; // return
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

    res.status(200).json(response)

})

const getCategoryList = catchAsync(async (req, res) => {
    // Ensure MEDIA_URL is defined somewhere in your environment or config
    

    try {
        
        const categories = await Category.find({ is_featured: true })
            .select('_id name icon banner tag')
            .sort({ sort_order: 1 });

        if (categories.length > 0) {
            const response = {
                status: 200,
                message: 'Success',
                categories: categories.map(category => ({
                    Category_Id: category._id,
                    name: category.name,
                    banner: category.banner && `${MEDIA_URL}${category.banner}`,
                    tag: category.tag, 
                }))
            };
            res.status(200).json(response);
        } else {
            // Handle case when no categories are found
            res.status(404).json({
                status: 404,
                message: 'No featured categories found'
            });
        }
    } catch (error) {
        // Handle potential errors during database operations
        res.status(500).json({
            status: 500,
            message: 'Server error',
            error: error.message
        });
    }
});



// const getcategoryId = catchAsync(async (req, res) => {
//     const query = pick(req.query, ['sort', 'page']);
//     const{sort}=query
//     const { categoryId } = req.params


//   // Find the category by ID
//     const category = await Category.findById(categoryId);
//     if (!category)throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');

//     let productsQuery =await Product.find({ categories: categoryId });

//     //filter or paginate function
//      let FilterProducts= filters(productsQuery,query)

//  const product = FilterProducts.sortedProducts
//  const pageNumber = FilterProducts.page


//     //Response structure
//     const response = {
//         status: 200,
//         message: 'Success',
//         data: {
//             name: category.name,
//             banner: category.banner,
//             description: category.description,
//             sub_categories: category.sub_categories, // Assuming this data is already populated in the category document
//             products: product.map(product => ({
//                 name: product.name,
//                 description_short: product.description_short,
//                 image: product.image,
//                 price: product.price,
//                 price_discounted: product.discounted_price,
//                 brand: {
//                     brand_id: product.brand_id,
//                     name: product.brand_name // Assuming brand_name is a field in the product schema
//                 }
//             })),
//             filter_list: category.filter_list // Assuming filter_list is a field in the category schema
//         },
//         meta: {
//             current_page: pageNumber,
//             total: product.length, // Total number of products (for the current query)
//             query_params: {
//                 sort,
//                 page: pageNumber
//             }
//         }
//     };
//     res.status(200).json(response)


// })




module.exports = { getFiltercategory, getCategoryList }
