const httpStatus = require('http-status');

const ApiError = require('../../utils/ApiError');
const { Customer, Order } = require('../../models');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createCustomer = async ({ email, mobile }) => {


  try {
    if (email) {
      response = await Customer.findOne({ email }).exec();
    }
    if (mobile) {
      response = await Customer.findOne({ mobile }).exec();
    }

    if (response) {

      return res.status(404).json({

        message: "User already Exists"
      })
    } else {
      if (email) {
        console.log('email' + email)
        const cust = await Customer.create({ 'email': email });
        return cust;
      }
      if (mobile) {
        const cust = await Customer.create({ mobile });
        return cust;
      }


    }

  } catch (err) {
    return err;
  }
};


const updateCustomer = async (body) => {
  const { email, mobile } = body;
  try {
    let response;
    if (mobile) {
      response = await Customer.findOne({ 'mobile': mobile }).exec();
    }
    if (email) {
      response = await Customer.findOne({ 'email': email }).exec();
    }
    if (response) {
      response.first_name = body.first_name;
      response.last_name = body.last_name;
      response.dob = body.dob;
      response.gender = body.gender;
      response.save();
      return response;

    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Phone number or email does not exist');
    }


  } catch (err) {
    return err;
  }
}

const queryCustomers = async (filter, options) => {
  try {
    // Fetch customers and populate necessary fields
    const customers = await Customer.find(filter)
      .populate('wishlist')
      .populate('favoriteBrands')
      .sort({ createdAt: -1 })
      .lean(); // Use lean for better performance when just reading

    // Aggregate orders for each customer
    const customerIds = customers.map(customer => customer._id);
    const ordersAggregation = await Order.aggregate([
      { $match: { 'customer.customerId': { $in: customerIds } } },
      {
        $group: {
          _id: '$customer.customerId',
          totalOrders: { $sum: 1 },
          totalSales: { $sum: '$total' },
        },
      },
    ]);

    // Create a lookup object for quick reference
    const ordersLookup = {};
    ordersAggregation.forEach(order => {
      ordersLookup[order._id] = order;
    });

    // Attach total orders and total sales to each customer
    const customersWithOrderStats = customers.map(customer => {
      const orderStats = ordersLookup[customer._id] || { totalOrders: 0, totalSales: 0 };
      return {
        ...customer,
        totalOrders: orderStats.totalOrders,
        totalSales: orderStats.totalSales,
      };
    });

    return customersWithOrderStats;
  } catch (error) {
    console.error('Error fetching customers with order stats:', error);
    throw new Error('Error fetching customers with order stats');
  }
};

const queryCustomersById = async (id) => {
  try {
    // Find customer by ID and populate necessary fields
    const customer = await Customer.findById(id)
      .populate('wishlist')
      .populate('favoriteBrands');
    

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Fetch orders for the customer using the static method getOrders
    let orders = [];
    try {
      orders = await Customer.getOrders(customer._id);
    } catch (orderError) {
      console.error(`Error fetching orders for customer ${customer._id}:`, orderError);
    }

    // Convert the Mongoose document to a plain JavaScript object and add the orders field
    const customerObj = customer.toObject();
    customerObj.orders = orders;

    return customerObj;
  } catch (error) {
    console.error(error);
    throw new Error('Error fetching customer details');
  }
};



const getUserByEmailOrPhone = async (result) => {
  const { email, mobile } = result

  try {
    let query;
    if (mobile) {
      query = { mobile };
    } else {
      query = { email };
    }

    const customer = await Customer.findOne(query);
    console.log('customer:', customer)
    if (customer) {
      return customer

    } else {
      console.log('Customer not found');
    }
  } catch (error) {
    console.error('Error finding user:', error);
  }

}

module.exports = {
  createCustomer,
  updateCustomer,
  getUserByEmailOrPhone,
  queryCustomers,
  queryCustomersById
};
