const httpStatus = require('http-status');
const Brand = require('../../models/brand.model');
const Product = require('../../models/product.model');
const { filters } = require('../../services/store/filter.service');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const MEDIA_URL = process.env.MEDIA_URL;

const formatProduct = (product) => {
  const productImages = product.media ? product.media.map(filename => MEDIA_URL + filename) : [];
  const productVariants = product.product_variants && Array.isArray(product.product_variants) ? product.product_variants.map(variant => ({
    variant_id: variant._id,
    name: variant.name,
    price: variant.price,
    discounted_price: variant.discounted_price,
    discount_percentage: variant.discounted_price ? Math.round(((variant.price - variant.discounted_price) / variant.price) * 100) : 0,
    stock: variant.stock,
    sku: variant.sku,
    image: variant.image ? `${MEDIA_URL}${variant.image}` : "",
  })) : [];

  return {
    Product_id: product._id,
    name: product.name,
    image: productImages,
    short_description: product.description_short,
    price: {
      currency: "AED",
      amount: product.discounted_price ? product.discounted_price : product.price,
      original_amount: product.price,
      discount_percentage: product.discounted_price ? Math.round(((product.price - product.discounted_price) / product.price) * 100) : 0,
    },
    brand: {
      brand_id: product.brand_id._id,
      name: product.brand_id.name,
      logo: `${MEDIA_URL}${product.brand_id.logo}`
    },
    categories: product.categories.map(category => ({
      id: category._id,
      name: category.name,
      slug: category.slug,
    })),
    tags: product.productTags || [],
    variants: productVariants,
  };
};

const getRandomTags = (tags, count) => {
  const shuffled = tags.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getFilterBrands = catchAsync(async (req, res) => {
  const query = pick(req.query, ['sort', 'page']);
  const { brandsId } = req.params;
  const { sort } = query;
  const filterData = req.body.filter;

  const brand = await Brand.findById(brandsId);
  if (!brand) throw new ApiError(httpStatus.NOT_FOUND, 'Brand is not found');

  // Fetch products with their categories populated
  const productsQuery = await Product.find({ brand_id: brandsId })
    .populate('brand_id')
    .populate('categories', 'name slug _id');

  let FilterProducts = filters(productsQuery, query, filterData);
  const products = FilterProducts.sortedProducts;
  const pageNumber = FilterProducts.page;

  // Fetch trending products
  const trendingProductsQuery = await Product.find({ _id: { $in: brand.trending_products } })
    .populate('brand_id')
    .populate('categories', 'name slug _id');
  const trendingProducts = trendingProductsQuery.map(formatProduct);

  // Gather all tags from products
  const allTags = products.flatMap(product => product.productTags);
  const uniqueTags = [...new Set(allTags)];
  const randomTags = getRandomTags(uniqueTags, 10);

  // Create a map of categories to products
  const categoryMap = {};
  products.forEach(product => {
    product.categories.forEach(category => {
      if (!categoryMap[category.slug]) {
        categoryMap[category.slug] = {
          category: {
            id: category._id,
            name: category.name,
            slug: category.slug,
          },
          products: [],
        };
      }
      categoryMap[category.slug].products.push(formatProduct(product));
    });
  });

  // Convert categoryMap to array of categories with products
  const categorizedProducts = Object.values(categoryMap);

  const productSlideshow = brand.slide_show.map(image => MEDIA_URL + image);

  let brand_images;
  if (brand.images && brand.images.length > 0) {
    brand_images = brand.images.reduce((acc, img) => {
      acc[img.label] = `${MEDIA_URL}${img.value}`;
      return acc;
    }, {});
  }

  const response = {
    status: 200,
    message: 'Success',
    data: {
      name: brand.name,
      banner: brand.banner,
      slideshow: productSlideshow,
      description: brand.description,
      brand_logo: `${MEDIA_URL}${brand.logo}`,
      brand_color: brand.color,
      products_by_category: categoryMap,
      trending_products: trendingProducts,
      tags: randomTags,
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
  res.status(200).json(response);
});

module.exports = { getFilterBrands };
