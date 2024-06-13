// Helper function to check if a date is valid
const isValidDate = (discountDate, discountTime, now, isEndDate = false) => {
    const date = new Date(discountDate);
    if (discountTime) {
      const [hours, minutes] = discountTime.split(':');
      date.setHours(hours, minutes, 0, 0);
    }
    return isEndDate ? now <= date : now >= date;
  };
  
  module.exports = { isValidDate };
  