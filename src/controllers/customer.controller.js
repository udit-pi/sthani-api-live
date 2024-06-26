const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const {customerService} = require('../services/store')


const getCustomers = catchAsync(async (req, res) => {

    const filter = pick(req.query, ['name', 'role']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await customerService.queryCustomers(filter, options);
    // console.log(result)
    res.send(result);

})

const getCustomersById= catchAsync(async (req, res) => {

const {id}=req.params

const customerDetails=await customerService.queryCustomersById(id)
res.send(customerDetails)

})

module.exports = {
    getCustomers,
    getCustomersById
}