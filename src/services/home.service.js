const { Home } = require("../models");
const { uploadSingleFile } = require("./fileUpload.service");

const uploadFolder = process.env.UPLOAD_FOLDER || "/var/www/html/media";

const saveHome = async (req) => {
  try {
    const home = new Home();

    home.title = req.body.title;
    home.subtitle = req.body.subtitle;
    home.placement_id = req.body.placement_id;
    home.items = req.body.items;
    home.widget_type = req.body.widget_type;

    const item_count = req.body.items.length;
    if (item_count > 0) {
      for (let i = 0; i < item_count; i++) {
        if (req.files[`items[${i}][image]`]) {
          const image = uploadSingleFile(req.files[`items[${i}][image]`]);
          console.log(image);
          home.items[i].image = image;
        }
      }
    }

    const result = await home.save();

    return result;
  } catch (err) {
    throw err;
  }
};

const queryWidgets = async (filter, options) => {
  // const brands = await Brand.paginate(filter, options);
  try {
    const widgets = await Home.find({});
    return widgets;
  } catch (err) {
    throw err;
  }
};

const getWidgetById = async (id) => {
  try {
   
    const result =  await Home.findById(id).select('-createdAt');
    
    return result
  } catch (err) {
    throw err;
  }
};

const updateWidgetById =  async (widgetId, req) => {
  try {
   
   
      const home = await  getWidgetById(widgetId);
 

      home.title = req.body.title;
      home.subtitle = req.body.subtitle;
      home.placement_id = req.body.placement_id;
  
      home.widget_type = req.body.widget_type;
      home.items = [...req.body.items];
   
   

    // if (req.body.widget_type === "slideshow") {
    //   home.items =   req.body.items?.map((item) => ({
    //     tag: item.tag,
    //     description: item.description,
    //     slideShowBrand: item.slideShowBrand,
    //     destination: item.destination,
    //     id: item.id,
    //   }));
    // }

    // console.log(req.body);
     console.log('home',home);

    const item_count = req.body.items.length;
    if (item_count > 0) {
      for (let i = 0; i < item_count; i++) {
        if (req.files[`items[${i}][image]`]) {
          const image = uploadSingleFile(req.files[`items[${i}][image]`]);
          console.log(image);
          home.items[i].image = image;
        }
      }
    }

    const result = await home.save();

    return result;
  } catch (err) {
    throw err;
  }
};

const deleteWidgetById = async (widgetId) => {
  try {
    const widget = await getWidgetById(widgetId);

    const item_count = widget.items.length;
    if (item_count > 0) {
      for (let i = 0; i < item_count; i++) {
        console.log(widget.items[i]);
        if (
          typeof widget.items[i].image !== "undefined" &&
          widget.items[i].image !== null
        ) {
          const imagePath = path.join(
            __dirname,
            uploadFolder,
            widget.items[i].image
          );
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error("Error deleting image:", err);
              return res.status(500).json({ error: "Failed to delete image" });
            }
          });
        }
      }
    }
    const res = await widget.remove();
    console.log(res);
    return res;
  } catch (err) {
    throw err;
  }
  // const brand = await getBrandById(brandId);
  // // console.log(brand)

  // if (!brand) {
  //   throw new ApiError(httpStatus.NOT_FOUND, 'Brand not found');
  // }
  // const logo = brand.logo;

  // // Construct the path to the image file
  // const imagePath = path.join(__dirname, '../uploads', logo);

  // // Delete the image file from the file system
  // fs.unlink(imagePath, (err) => {
  //   if (err) {
  //     console.error('Error deleting image:', err);
  //     return res.status(500).json({ error: 'Failed to delete image' });
  //   }
  // });

  // const images = brand.images;
  // images.map((image) => {
  //   const imageName = image.value;
  //   const imagePath = path.join(__dirname, '../uploads', imageName);

  //   // Delete the image file from the file system
  //   fs.unlink(imagePath, (err) => {
  //     if (err) {
  //       console.error('Error deleting image:', err);
  //       return res.status(500).json({ error: 'Failed to delete image' });
  //     }
  //   });
  // });

  // await brand.remove();
  // return brand;
};

module.exports = {
  saveHome,
  queryWidgets,
  getWidgetById,
  updateWidgetById,
  deleteWidgetById,
};
