const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { Customer } = require('../../models');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const { updateProfileValidation } = require('../../validations/store/profile.validation');
const customerModel = require('../../models/customer.model');


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

      if(req.body.mobile) {
        const existingUserWithPhone = await Customer.findOne({'mobile': req.body.mobile})
      
          if (existingUserWithPhone && existingUserWithPhone._id.toString() != userId.toString()) {
           
          return res.status(400).json({ status: 400, message : "Mobile number is already registered"});
          }
        
      }
      if(req.body.email) {
        const existingUserWithEmail = await Customer.findOne({'email': req.body.email})
        if (existingUserWithEmail && existingUserWithEmail._id.toString() != userId.toString()) {
          return res.status(400).json({ status: 400, message : "Email address is already registered"});
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
        res.json({message: `MongoDB validation error:  '${duplicateKey}' with value '${duplicateValue}' already exists.`});
    } else {
        res.json({message: "Unknown MongoDB validation error."});
    }
      
    }
    
  })



const getDetails=catchAsync(async(req,res)=>{


  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  } 
  const payload = jwt.verify(token, config.jwt.secret);


const customerId=payload.sub
try{


const customer = await customerModel.findById(customerId);

if (!customer) {
  return res.status(404).json({ status: 404, message: 'Customer not found' });
}
const defaultAddress = customer.addresses.find(address => address.default);

const responseData = {
  first_name: customer.first_name,
  last_name: customer.last_name,
  mobile: customer.mobile,
  email: customer.email,
  dob: customer.dob,
  gender: customer.gender,
  default_address: defaultAddress
};

res.status(200).json({ status: 200, message: 'Success', data: responseData });
}catch(error){
  console.error('Error fetching customer profile:', error);
  res.status(500).json({ status: 500, message: 'Internal Server Error' });
}
})


const addAddress=catchAsync(async(req,res)=>{
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  } 
  const payload = jwt.verify(token, config.jwt.secret);


const customerId=payload.sub

const { name, mobile, address_line, city, state, postal_code, landmark, address_type } = req.body;
try{


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

}catch(error){
  console.error('Error adding customer address:', error);
  res.status(500).json({ status: 500, message: 'Internal Server Error' });


}








})


const getAllAddress=catchAsync(async(req,res)=>{

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  } 
  const payload = jwt.verify(token, config.jwt.secret);


const customerId=payload.sub
try{

  const customer = await Customer.findById(customerId);

  if (!customer) {
    return res.status(404).json({ status: 404, message: 'Customer not found' });
  }

  // Extract addresses from the customer
  const addresses = customer.addresses;

  res.status(200).json({ status: 200, message: 'Success', data: addresses });






}catch(error){
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


const customerId=payload.sub
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
    if (addressToDelete.default==true) {
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


const customerId=payload.sub
  try {
   
    const addressId = req.params.address_Id; // Assuming the address ID is passed in the URL parameters
    const { name, mobile, address_line, city, state, postal_code, landmark, address_type,default:isDefault} = req.body;

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

   console.log("The default is"+isDefault)

    // Update the address fields
    addressToUpdate.name = name;
    addressToUpdate.mobile = mobile;
    addressToUpdate.address_line = address_line;
    addressToUpdate.city = city;
    addressToUpdate.state = state;
    addressToUpdate.postal_code = postal_code;
    addressToUpdate.landmark = landmark;
    addressToUpdate.address_type = address_type;






    // Save the updated customer
    // await customer.save();

    res.status(200).json({ status: 200, message: 'Address updated successfully', data: addressToUpdate });
  } catch (error) {
    console.error('Error updating customer address:', error);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }
};




module.exports = {
    updateProfile,getDetails,addAddress
,getAllAddress,deleteCustomerAddress,updateCustomerAddress}