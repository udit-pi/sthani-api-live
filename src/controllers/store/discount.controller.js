const Discount = require('../../models/discount.model');
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');
const { isValidDate } = require('../../utils/dateUtils');
const catchAsync = require('../../utils/catchAsync');

// Method to validate discount code
exports.validateDiscountCode = catchAsync(async (req, res, next) => {
    const { code, subtotal } = req.body;
    const customer = req.customer;
    console.log(customer);
    const customerId = customer._id;

    const discount = await Discount.findOne({ code });
    //console.log("Discount Details", discount);
    //console.log(discount.usedBy[0].customerId.toString(), "==", customerId)
    //console.log(discount.usedBy.some((usage) => usage.customerId.toString() === customerId));

    if (!discount) {
        return next(new ApiError(httpStatus.NOT_FOUND, 'Discount code not found'));
    }

    // Check if discount status is "Active"
    if (discount.status !== 'Active') {
        return next(new ApiError(httpStatus.NOT_FOUND, 'Discount code is not active'));
    }

    // Check if discount code has been used by the same customer
    if (discount.limitToOneUse && discount.usedBy.some((usage) => usage.customerId.toString() === customerId.toString())) {
        return next(new ApiError(httpStatus.NOT_FOUND, 'Discount code already used'));
    }

    // Check if discount code is valid based on start date and end date
    const now = new Date();
    if (!isValidDate(discount.startDate, discount.startTime, now) ||
        (discount.endDate && !isValidDate(discount.endDate, discount.endTime, now, true))) {
        return next(new ApiError(httpStatus.NOT_FOUND, 'Discount code is not valid at this time'));
    }

    // Check if minimum purchase amount is met
    if (discount.minimumPurchaseAmount && subtotal < discount.minimumPurchaseAmount) {
        return next(new ApiError(httpStatus.NOT_FOUND, 'Subtotal does not meet the minimum purchase amount for this discount'));
    }

    // Calculate the final discount value based on the discount type and value
    let finalDiscountValue = 0;
    if (discount.discountValueType === 'PERCENTAGE') {
        finalDiscountValue = (subtotal * (discount.discountValue / 100));
    } else if (discount.discountValueType === 'AMOUNT') {
        finalDiscountValue = discount.discountValue;
    }

    // Handle free shipping discount type
    if (discount.discountType === 'FREE_SHIPPING') {
        return res.status(200).json({
            status: 'valid',
            discountCode: discount.code,
            discountType: 'FREE_SHIPPING', // Since it's free shipping, the discount is equivalent to $0 shipping
            discountValue: 0 
        });
    }

    res.status(200).json({
        status: "valid",
        discountCode: discount.code,
        discountType: 'ORDER_DISCOUNT',
        discountValue: discount.discountValue,
        discountValueType: discount.discountValueType,
        discountValue: finalDiscountValue,
        
    });
});

// Method to mark discount code as used by a customer when an order is created
exports.markDiscountCodeUsed = catchAsync(async (req, res, next) => {
    const { code, orderId } = req.body;
    const customer = req.customer;

    const discount = await Discount.findOne({ code });
    const customerId = customer._id;

    if (!discount) {
        return next(new ApiError(httpStatus.NOT_FOUND, 'Discount code not found'));
    }

    if (discount.limitToOneUse && discount.usedBy.some((usage) => usage.customerId.toString() === customerId)) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Discount code already used by this customer'));
    }

    discount.usedBy.push({
        customerId,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        orderId,
    });
    discount.used += 1;
    await discount.save();

    res.status(200).json({ message: 'Discount code marked as used' });
});