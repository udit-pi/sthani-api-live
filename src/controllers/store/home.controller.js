const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");

const MEDIA_URL = 'http://localhost:3500/uploads/'; 

const config = require("../../config/config");
const {
  Home,
  Brand,
  Category,
  Product,
  ProductMedia,
} = require("../../models");

const setProduct = (product,productImage,brand) => {
  try {
    let productData = [];
    productData.push({
      name: product.name,
      image: productImage?.file_name
        ? MEDIA_URL + productImage.file_name
        : "No Image",
      brand: {
        name: brand.name,
        logo: MEDIA_URL+ brand.logo,
      },
      link: {
        destination: "product",
        id: product.id,
      },
      price: {
        amount: product.price,
        original_amount: product.cost,
        discounted_price: product.discounted_price,
      },
    });
    return productData
  } catch(err) {
    throw err
  }
 
}

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
                image: MEDIA_URL + item.image,
                description: item.description,
                tag: item.tag,
                brand: {
                  name: brand.name,
                  logo: MEDIA_URL + brand.logo,
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

              categories.push({
                image: item.image ? MEDIA_URL + item.image : MEDIA_URL + category.banner,
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
                name: brand.name,
                logo: MEDIA_URL + brand.logo,
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
              products = setProduct(product,productImage,brand)
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
            let products = [];
          
  
            await Promise.all(
              widget.items?.map(async (item) => {
                const category = await Category.findById(item.category);
                 
               
                await Promise.all(item.products?.map(async (product) => {
                    const prod = await Product.findById(product.value);
                    const brand = await Brand.findById(prod.brand_id);

                    const productImage = await ProductMedia.findOne({
                        product_id: product.value,
                        title: "Media",
                      }).exec();
                    // products.push({
                    //     name: prod.name,
                    //     image: productImage?.file_name
                    //     ? productImage.file_name
                    //     : "No Image",
                    //     brand: {
                    //         name: brand.name,
                    //         logo: brand.logo,
                    //       },
                    //       link: {
                    //         destination: "product",
                    //         id: product.value,
                    //       },
                    //       price: {
                    //         amount: prod.price,
                    //         original_amount: prod.cost,
                    //         discounted_price: prod.discounted_price,
                    //       },

                    // })
                    products = setProduct(prod,productImage,brand)
                })
            )
                categories.push({
                    image: item.image ? MEDIA_URL + item.image : MEDIA_URL + category.banner,
                    name: category.name,
                    tag: item.tag,
                    products: products
    
                    
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
          let products = []
          console.log(widget);
         
          await Promise.all(
            widget.items?.map(async (item) => {
              const brand = await Brand.findById(item.brand);
              brandObject = {
              id: brand._id,
              name: brand.name,
              tag: item.tag,
              description: item.description,
              logo: brand.logo,
              banner: brand.banner ? brand.banner : 'NO banner'
            }
            await Promise.all(item.products?.map(async (product) => {
              const prod = await Product.findById(product.value);
              const brand = await Brand.findById(prod.brand_id);

              const productImage = await ProductMedia.findOne({
                  product_id: product.value,
                  title: "Media",
                }).exec();
            
              products = setProduct(prod,productImage,brand)
            
          }))
        
             
            })
          );
          const data = {
            widget_position: widget.placement_id,
            widget_type: widget.widget_type,
            widget_title: widget.title,
            widget_subtitle: widget.subtitle,
            brand: brandObject,
            products: products
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
