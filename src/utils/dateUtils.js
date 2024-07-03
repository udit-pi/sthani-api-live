const moment = require('moment-timezone');

const TIMEZONE = 'Asia/Dubai';
const DATE_FORMAT = 'DD/MM/YYYY hh:mm A'; // Standard SQL datetime format, you can customize this as needed

/**
 * Formats a date into the Dubai timezone.
 * @param {string | Date} date - The date to format. Can be a Date object or a string.
 * @returns {string} The formatted date string.
 */
const formatDateUAE = (date, format = DATE_FORMAT) => {
  return moment(date).tz(TIMEZONE).format(format);
};

// Helper function to check if a date is valid
const isValidDate = (discountDate, discountTime, now, isEndDate = false) => {
    const date = new Date(discountDate);
    if (discountTime) {
      const [hours, minutes] = discountTime.split(':');
      date.setHours(hours, minutes, 0, 0);
    }
    return isEndDate ? now <= date : now >= date;
};

// Export the necessary functions
module.exports = { formatDateUAE, isValidDate };
