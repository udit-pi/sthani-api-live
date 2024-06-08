const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");

const MEDIA_URL = process.env.MEDIA_URL;

const config = require("../../config/config");
const {
  Home,
  Brand,
  Category,
  Product,
  ProductMedia,
} = require("../../models");

const calculateDiscountedPercentage = (price,discountValue) => {

  if(discountValue !== 0) {
    const percentage = ((price - discountValue)/ price ) * 100;
    discounted_percentage = parseFloat(percentage.toFixed(0));
    return discounted_percentage
  }
  return 0
}
const setProduct = (product, productImage, brand) => {
  try {
    const percent =  calculateDiscountedPercentage(product.price,product.discounted_price ? product.discounted_price : 0)
    const productImages = product.media ? product.media.map(filename => MEDIA_URL + filename) : [];
    let productData = {}
    productData = {
      
      id: product.id,
      name: product.name,
      image: productImages,
      brand: { 
        brand_id: brand._id,
        name: brand.name,
        logo:  brand.logo ? MEDIA_URL + brand.logo : ""
      },
      link: {
        destination: "product",
        id: product.id,
      },
      price: {
        amount: product.discounted_price ? product.discounted_price: product.price,
        original_amount: product.price,
        discount_percentage: percent,
      },
    };
    return productData;
  } catch (err) {
    throw err;
  }
};

const getwidgets = catchAsync(async (req, res) => {
  // const authHeader = req.headers['authorization'];
  // const token = authHeader && authHeader.split(' ')[1];
  // if (!token) {
  //   return res.status(401).json({ error: 'Token not provided' });
  // }
  // const payload = jwt.verify(token, config.jwt.secret);

  // const customer = await Customer.findById(payload.sub)

  try {
    const widgets = await Home.find().sort({ placement_id: 1 }).exec();
    const result = await Promise.all(
      widgets?.map(async (widget) => {
        // slideshow
        if (widget.widget_type === "slideshow") {
          let slides = [];
          await Promise.all(
            widget.items?.map(async (item) => {
              const brand = await Brand.findById(item.brand);
              slides.push({
                image: item.image ? MEDIA_URL + item.image : "",
                description: item.description,
                tag: item.tag,
                brand: {
                  brand_id: brand._id,
                  name: brand.name,
                  logo: brand.logo ? MEDIA_URL + brand.logo : "",
                },
                cta: {
                  link: {
                    destination: item.destination,
                    id: item.id,
                  },
                },
              });
            })
          );
          const data = {
            widget_position: widget.placement_id,
            widget_type: widget.widget_type,
            widget_title: widget.title,
            widget_subtitle: widget.subtitle,
            slides: slides,
          };
          return data;
        }
        // categories
        if (widget.widget_type === "categories") {
          let categories = [];

          await Promise.all(
            widget.items?.map(async (item) => {
              const category = await Category.findById(item.category);
              // console.log('category',category)
              categories.push({
                image: item.image
                  ? MEDIA_URL + item.image
                  : "",
                name: category.name,
                tag: item.tag,

                link: {
                  destination: "category",
                  id: item.category,
                },
              });
            })
          );
          const data = {
            widget_position: widget.placement_id,
            widget_type: widget.widget_type,
            widget_title: widget.title,
            widget_subtitle: widget.subtitle,
            categories: categories,
          };
          return data;
        }

        // brands

        if (widget.widget_type === "brands") {
          let brands = [];

          await Promise.all(
            widget.items?.map(async (item) => {
              const brand = await Brand.findById(item.brand);

              brands.push({
                brand_id: brand._id,
                name: brand.name,
                logo: brand.logo ? MEDIA_URL + brand.logo: "",
                link: {
                  destination: "brand",
                  id: item.brand,
                },
              });
            })
          );
          const data = {
            widget_position: widget.placement_id,
            widget_type: widget.widget_type,
            widget_title: widget.title,
            widget_subtitle: widget.subtitle,
            brands: brands,
          };
          return data;
        }

        // products

        if (widget.widget_type === "products") {
          let products = [];

          await Promise.all(
            widget.items?.map(async (item) => {
              const product = await Product.findById(item.product);
              const productImage = await ProductMedia.findOne({
                product_id: item.product,
                title: "Media",
              }).exec();
              const brand = await Brand.findById(product.brand_id);

              // products.push({
              //   name: product.name,
              //   image: productImage?.file_name
              //     ? productImage.file_name
              //     : "No Image",
              //   brand: {
              //     name: brand.name,
              //     logo: brand.logo,
              //   },
              //   link: {
              //     destination: "product",
              //     id: item.product,
              //   },
              //   price: {
              //     amount: product.price,
              //     original_amount: product.cost,
              //     discounted_price: product.discounted_price,
              //   },
              // });
              const result = setProduct(product, productImage, brand);
              products.push(result);
            })
          );
          const data = {
            widget_position: widget.placement_id,
            widget_type: widget.widget_type,
            widget_title: widget.title,
            widget_subtitle: widget.subtitle,
            products: products,
          };
          return data;
        }

        // featured categories
        if (widget.widget_type === "featured_categories") {
          let categories = [];
          let updatedProducts = [];
        
          // console.log(widget);
          await Promise.all(
            widget.items?.map(async (item) => {
              const category = await Category.findById(item.category);
              let products = []; // Initialize products array for each category
        
              await Promise.all(
                item.products?.map(async (product) => {
                  const prod = await Product.findById(product.value);
                  const brand = await Brand.findById(prod.brand_id);
        
                  const productImage = await ProductMedia.findOne({
                    product_id: product.value,
                    title: "Media",
                  }).exec();
        
                  const result = setProduct(prod, productImage, brand);
                  updatedProducts.push(result);
                  products.push(result); 
                })
              );
        
              categories.push({
                image: item.image ? MEDIA_URL + item.image : "",
                name: category.name,
                tag: item.tag,
                products: products, // Assign the category-specific products list
              });
            })
          );
        
          const data = {
            widget_position: widget.placement_id,
            widget_type: widget.widget_type,
            widget_title: widget.title,
            widget_subtitle: widget.subtitle,
            categories: categories,
          };
        
          return data;
        }
        

        //   featured brand

        if (widget.widget_type === "featured_brand") {
          let brandObject = {};
          let products = [];

          await Promise.all(
            widget.items?.map(async (item) => {
              const brand = await Brand.findById(item.brand);
             
              brandObject = {
                id: brand._id,
                name: brand.name,
                tag: item.tag,
                description: item.description,
                logo: brand.logo ? MEDIA_URL + brand.logo: "",
                banner: brand.banner ? MEDIA_URL + brand.banner : "",
              };
              await Promise.all(
                item.products?.map(async (product) => {
                  const prod = await Product.findById(product.value);
               
                  const brand = await Brand.findById(prod.brand_id);
                 
                  const productImage = await ProductMedia.findOne({
                    product_id: product.value,
                    title: "Media",
                  }).exec();

                  const result = setProduct(prod, productImage, brand);
                  products.push(result);
                })
              );
            })
          );
          const data = {
            widget_position: widget.placement_id,
            widget_type: widget.widget_type,
            widget_title: widget.title,
            widget_subtitle: widget.subtitle,
            brand: brandObject,
            products: products,
          };
          return data;
        }
      })
    );

    // Filter out falsy values (null, undefined)
    const filteredResult = result.filter(Boolean);

    if (filteredResult.length > 0) {
      res.json({ widgets: filteredResult });
    }
  } catch (error) {
    console.error("MongoDB error:", error);
    res.json({ message: "Error occurred while fetching data from MongoDB." });
  }
});

module.exports = {
  getwidgets,
};
