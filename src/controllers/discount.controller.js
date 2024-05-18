const Discount = require("../models/discount.model");
const catchAsync = require("../utils/catchAsync");








const saveDiscount=catchAsync(async (req, res) => {

    try {
        const { discountType, code, discountValueType, discountValue, minimumPurchaseAmount, limitToOneUse, startDate, endDate, status,startTime,endTime } = req.body;
    
        // Create a new discount object
        const newDiscount = new Discount({
          discountType,
          code,
          discountValue,
          discountValueType,
          minimumPurchaseAmount,
          limitToOneUse,
          startDate,
          endDate,
          startTime,
          endTime,
          status,
        });
    
        // Save the discount to the database
        const savedDiscount = await newDiscount.save();
    
        res.status(201).json({ message: 'Discount saved successfully', discount: savedDiscount });
      } catch (error) {
        console.error('Error saving discount:', error);
        res.status(500).json({ message: 'Failed to save discount', error });
      }



    
})



const getAllDiscount=catchAsync(async (req, res) => {

    try {
        const discounts = await Discount.find();
        res.status(200).json(discounts);
      } catch (error) {
        console.error('Error fetching discounts:', error);
        res.status(500).json({ message: 'Failed to fetch discounts', error });
      }

})


const getDiscountById=catchAsync(async (req, res) => {

    try {
        const discount = await Discount.findById(req.params.id);
        if (!discount) {
          return res.status(404).json({ message: 'Discount not found' });
        }
        res.status(200).json(discount);
      } catch (error) {
        console.error('Error fetching discount:', error);
        res.status(500).json({ message: 'Failed to fetch discount', error });
      }

})


const deleteDiscountById=catchAsync(async (req, res) => {

    try {
        const discount = await Discount.findByIdAndDelete(req.params.id);
        if (!discount) {
          return res.status(404).json({ message: 'Discount not found' });
        }
        res.status(200).json({ message: 'Discount deleted successfully' });
      } catch (error) {
        console.error('Error deleting discount:', error);
        res.status(500).json({ message: 'Failed to delete discount', error });
      }



})

const updateDiscountById =catchAsync(async (req, res) => {

    try {
        const updatedDiscount = await Discount.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true, runValidators: true }
        );
        if (!updatedDiscount) {
          return res.status(404).json({ message: 'Discount not found' });
        }
        res.status(200).json({ message: 'Discount updated successfully', discount: updatedDiscount });
      } catch (error) {
        console.error('Error updating discount:', error);
        res.status(500).json({ message: 'Failed to update discount', error });
      }

})



module.exports={saveDiscount,getAllDiscount,getDiscountById,deleteDiscountById ,updateDiscountById}











