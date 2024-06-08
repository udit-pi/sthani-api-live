const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { Customer } = require('../../models');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const { updateProfileValidation } = require('../../validations/store/profile.validation');
const customerModel = require('../../models/customer.model');
const Product = require('../../models/product.model');
const MEDIA_URL = process.env.MEDIA_URL;


const updateProfile = catchAsync(async (req, res) => {

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  const payload = jwt.verify(token, config.jwt.secret);

  const customer = await Customer.findById(payload.sub)

  try {
    const userId = customer._id;
    const schema = await updateProfileValidation(userId);
    const validationResult = schema.validate(req.body);

    if (validationResult.error) {

      return res.status(400).json({ error: validationResult.error.details[0].message });
    }

    if (req.body.mobile) {
      const existingUserWithPhone = await Customer.findOne({ 'mobile': req.body.mobile })

      if (existingUserWithPhone && existingUserWithPhone._id.toString() != userId.toString()) {

        return res.status(400).json({ status: 400, message: "Mobile number is already registered" });
      }

    }
    if (req.body.email) {
      const existingUserWithEmail = await Customer.findOne({ 'email': req.body.email })
      if (existingUserWithEmail && existingUserWithEmail._id.toString() != userId.toString()) {
        return res.status(400).json({ status: 400, message: "Email address is already registered" });
      }
    }

    customer.first_name = req.body.first_name;
    customer.last_name = req.body.last_name;
    customer.dob = req.body.dob;
    customer.gender = req.body.gender

    customer.mobile = req.body.mobile

    customer.email = req.body.email

    const updatedCustomer = await customer.save();
    res.status(200).json({
      status: 200,
      message: "Profile updated successfully"
    }

    );
  } catch (error) {

    if (error.code === 11000) {
      const duplicateKey = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateKey];
      res.json({ message: `MongoDB validation error:  '${duplicateKey}' with value '${duplicateValue}' already exists.` });
    } else {
      res.json({ message: "Unknown MongoDB validation error." });
    }

  }

})



const getDetails = catchAsync(async (req, res) => {


  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  const payload = jwt.verify(token, config.jwt.secret);


  const customerId = payload.sub
  try {


    const customer = await customerModel.findById(customerId);

    if (!customer) {
      return res.status(404).json({ status: 404, message: 'Customer not found' });
    }
    const defaultAddress = customer.addresses.find(address => address.default);
    let address;

    if (defaultAddress) {

      const address = {
        address_id: defaultAddress._id,
        name: defaultAddress.name,
        mobile: defaultAddress.mobile,
        address_line: defaultAddress.address_line,
        city: defaultAddress.city,
        state: defaultAddress.state,
        postal_code: defaultAddress.postal_code,
        landmark: defaultAddress.landmark,
        address_type: defaultAddress.address_type,
        default_address: defaultAddress.default
      }
    }

    const responseData = {
      first_name: customer.first_name,
      last_name: customer.last_name,
      mobile: customer.mobile,
      email: customer.email,
      dob: customer.dob,
      gender: customer.gender,
      //default_address: default_Address
    };

    if (address) {
      responseData.default_address = address;
    }

    res.status(200).json({ status: 200, message: 'Success', data: responseData });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }
})


const addAddress = catchAsync(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  const payload = jwt.verify(token, config.jwt.secret);


  const customerId = payload.sub

  const { name, mobile, address_line, city, state, postal_code, landmark, address_type } = req.body;
  try {


    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ status: 404, message: 'Customer not found' });
    }

    // Check if this is the first address for the customer
    const isFirstAddress = customer.addresses.length === 0;

    const newAddress = {
      name,
      mobile,
      address_line,
      city,
      state,
      postal_code,
      landmark,
      address_type,
      default: isFirstAddress
    };


    // Add the new address to the customer's addresses array
    customer.addresses.push(newAddress);

    await customer.save();

    res.status(201).json({ status: 201, message: 'Address added successfully', data: newAddress });

  } catch (error) {
    console.error('Error adding customer address:', error);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });


  }








})


const getAllAddress = catchAsync(async (req, res) => {

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  const payload = jwt.verify(token, config.jwt.secret);


  const customerId = payload.sub
  try {

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ status: 404, message: 'Customer not found' });
    }

    // Extract addresses from the customer
    const addresses = customer.addresses;

    const responseAddresses = {
      addresses: addresses.map((address) => ({
        address_id: address._id,
        name: address.name,
        mobile: address.mobile,
        address_line: address.address_line,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        landmark: address.landmark,
        address_type: address.address_type,
        default_address: address.default
      }))


    }



    res.status(200).json({ status: 200, message: 'Success', data: responseAddresses });






  } catch (error) {
    console.error('Error fetching customer addresses:', error);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }


})




const deleteCustomerAddress = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  const payload = jwt.verify(token, config.jwt.secret);


  const customerId = payload.sub
  try {

    const addressId = req.params.address_Id;

    // Fetch the customer
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ status: 404, message: 'Customer not found' });
    }

    // Check if the address to delete exists
    const addressToDelete = customer.addresses.find(address => address._id.toString() === addressId);
    if (!addressToDelete) {
      return res.status(404).json({ status: 404, message: 'Address not found' });
    }

    // Check if the address is the default and if it's the only address
    if (addressToDelete.default == true) {
      return res.status(400).json({ status: 400, message: 'Cannot delete default address as it is the only address' });
    }

    // Filter out the address to delete
    customer.addresses = customer.addresses.filter(address => address._id.toString() !== addressId);

    // Save the updated customer
    await customer.save();

    res.status(200).json({ status: 200, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer address:', error);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }
};


const updateCustomerAddress = async (req, res) => {

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  const payload = jwt.verify(token, config.jwt.secret);


  const customerId = payload.sub
  try {

    const addressId = req.params.address_Id; // Assuming the address ID is passed in the URL parameters
    const { name, mobile, address_line, city, state, postal_code, landmark, address_type, default: isDefault } = req.body;

    // Fetch the customer
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ status: 404, message: 'Customer not found' });
    }

    // Check if the address to update exists
    const addressToUpdate = customer.addresses.find(address => address._id.toString() === addressId);
    if (!addressToUpdate) {
      return res.status(404).json({ status: 404, message: 'Address not found' });
    }

    if (isDefault == false) {
      return res.status(404).json({ status: 404, message: 'default address not set as false' });
    }
    if (isDefault == true && addressToUpdate.default == true) {
      return res.status(404).json({ status: 404, message: 'default address are already true' });
    }



    //   // Update the address fields
    //   addressToUpdate.name = name;
    //   addressToUpdate.mobile = mobile;
    //   addressToUpdate.address_line = address_line;
    //   addressToUpdate.city = city;
    //   addressToUpdate.state = state;
    //   addressToUpdate.postal_code = postal_code;
    //   addressToUpdate.landmark = landmark;
    //   addressToUpdate.address_type = address_type;
    // //  addressToUpdate.isDefault=customer.addresses.default

    const updatedFields = {
      ...(name !== undefined && { name }),
      ...(mobile !== undefined && { mobile }),
      ...(address_line !== undefined && { address_line }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(postal_code !== undefined && { postal_code }),
      ...(landmark !== undefined && { landmark }),
      ...(address_type !== undefined && { address_type }),
    };

    Object.assign(addressToUpdate, updatedFields);

    if (isDefault == true) {
      addressToUpdate.default = true;
      customer.addresses.forEach(address => {
        if (address._id.toString() !== addressId) {
          address.default = false;
        }
      });
    }

    // Save the updated customer
    await customer.save();


    res.status(200).json({ status: 200, message: 'Address updated successfully', data: addressToUpdate });
  } catch (error) {
    console.error('Error updating customer address:', error);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }
};



const addProductToWishlist = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  const payload = jwt.verify(token, config.jwt.secret);


  const customerId = payload.sub
  try {

    const productId = req.params.product_Id;

    // Fetch the customer
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ status: 404, message: 'Customer not found' });
    }


    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ status: 404, message: 'Product not found' });
    }


    if (customer.wishlist.includes(productId)) {
      return res.status(400).json({ status: 400, message: 'Product is already in the wishlist' });
    }


    customer.wishlist.push(productId);





    await customer.populate({
      path: 'wishlist',
      populate: {
        path: 'brand',
        model: 'Brand'
      }
    }).execPopulate();


    const productlist = await Product.findById(productId).populate('brand_id');

    const wishlistProduct = {
      product_id: productlist._id,
      name: productlist.name,
      image: productlist.image,
      short_description: product.description_short,
      brand: {
        name: productlist.brand_id.name,
        logo: productlist.brand_id.logo
      },
      price: {
        currency: 'AED',
        amount: productlist.price,
        original_amount: productlist.discounted_price || productlist.price,
        discount_percentage: productlist.discounted_price ? Math.round(((productlist.price - productlist.discounted_price) / productlist.price) * 100) : 0
      }
    };




    await customer.save();



    res.status(200).json({ status: 200, message: 'Product added to wishlist successfully', data: wishlistProduct });
  } catch (error) {
    console.error('Error adding product to wishlist:', error);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }
};


const getWishlist = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  const payload = jwt.verify(token, config.jwt.secret);

  //http://localhost:3500/api/store/customer/wishlist
  const customerId = payload.sub
  try {


    // Fetch the customer
    const customer = await Customer.findById(customerId).populate({
      path: 'wishlist',
      populate: {
        path: 'brand',
        model: 'Brand'
      }
    });

    if (!customer) {
      return res.status(404).json({ status: 404, message: 'Customer not found' });
    }

    const wishlist = await Promise.all(customer.wishlist.map(async (productId) => {
      const product = await Product.findById(productId).populate('brand_id');
      console.log("Hello", product)
      const productImages = product.media.map(media => MEDIA_URL + media);
      console.log(productImages)
      return {
        id: product._id,
        name: product.name,
        image: productImages,
        short_description: product.description_short,
        brand: {
          brand_id: product.brand_id._id,
          name: product.brand_id.name,
          logo: ` ${MEDIA_URL}${product.brand_id.logo}`
        },
        price: {
          currency: 'AED',
          amount: product.price,
          original_amount: product.discounted_price || product.price,
          discount_percentage: product.discounted_price ? Math.round(((product.price - product.discounted_price) / product.price) * 100) : 0
        }
      };
    }));

    res.status(200).json({
      status: 200,
      message: 'Wishlist retrieved successfully.',
      wishlist
    });
  } catch (error) {
    console.error('Error retrieving wishlist:', error);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }
};



const removeProductFromWishlist = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  const payload = jwt.verify(token, config.jwt.secret);


  const customerId = payload.sub
  try {

    const productId = req.params.product_Id;

    // Fetch the customer
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ status: 404, message: 'Customer not found' });
    }

    // Check if the product is in the wishlist
    const productIndex = customer.wishlist.indexOf(productId);
    if (productIndex === -1) {
      return res.status(404).json({ status: 404, message: 'Product not found in wishlist' });
    }

    // Remove the product from the wishlist
    customer.wishlist.splice(productIndex, 1);

    // Save the updated customer document
    await customer.save();

    res.status(200).json({
      status: 200,
      message: 'Product removed from wishlist successfully.'
    });
  } catch (error) {
    console.error('Error removing product from wishlist:', error);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }
};

//fav brands contollers


const addFavBrand = catchAsync(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  const payload = jwt.verify(token, config.jwt.secret);


  const customerId = payload.sub

  try {

    const brandId = req.params.brand_id;

    // Fetch the customer
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ status: 404, message: 'Customer not found' });
    }

    // Check if the brand already exists in the favoriteBrands array
    if (customer.favoriteBrands.includes(brandId)) {
      return res.status(400).json({ status: 400, message: 'Brand already in favorite list' });
    }

    // Add the brand to the favoriteBrands array
    customer.favoriteBrands.push(brandId);



    // Populate the favorite brands with the brand details
    await customer.populate({
      path: 'favoriteBrands',
      select: 'name logo'
    }).execPopulate();



    // Format the response
    const favoriteBrands = customer.favoriteBrands.map(brand => ({
      id: brand._id,
      name: brand.name,
      logo: brand.logo
    }));

    // Save the updated customer document
    await customer.save();
    res.status(200).json({
      status: 200,
      message: 'Brand added to followed list successfully.',
      brands: favoriteBrands
    });
  } catch (error) {
    console.error('Error adding brand to favorite list:', error);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }




})


const getFavBrand = catchAsync(async (req, res) => {

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  const payload = jwt.verify(token, config.jwt.secret);


  const customerId = payload.sub

  try {


    // Fetch the customer
    const customer = await Customer.findById(customerId).populate({
      path: 'favoriteBrands',
      select: 'name logo'
    });

    if (!customer) {
      return res.status(404).json({ status: 404, message: 'Customer not found' });
    }

    // Format the response
    const favoriteBrands = customer.favoriteBrands.map(brand => ({
      id: brand._id,
      name: brand.name,
      logo: brand.logo
    }));

    res.status(200).json({
      status: 200,
      message: 'Brands retrieved successfully.',
      brands: favoriteBrands
    });
  } catch (error) {
    console.error('Error retrieving favorite brands:', error);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }



})


const deleteFavBrands = catchAsync(async (req, res) => {

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  const payload = jwt.verify(token, config.jwt.secret);


  const customerId = payload.sub

  try {

    const brandId = req.params.brand_id;

    // Fetch the customer
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ status: 404, message: 'Customer not found' });
    }

    // Check if the brand exists in the customer's favorite brands
    const brandIndex = customer.favoriteBrands.indexOf(brandId);
    if (brandIndex === -1) {
      return res.status(404).json({ status: 404, message: 'Brand not found in favorite list' });
    }

    // Remove the brand from the favorite brands list
    customer.favoriteBrands.splice(brandIndex, 1);
    await customer.save();

    res.status(200).json({
      status: 200,
      message: 'Brand removed from favorite list successfully.'
    });
  } catch (error) {
    console.error('Error removing favorite brand:', error);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }

})

module.exports = {
  updateProfile, getDetails, addAddress
  , getAllAddress, deleteCustomerAddress, updateCustomerAddress, addProductToWishlist, getWishlist, removeProductFromWishlist, addFavBrand, getFavBrand, deleteFavBrands
}