/**
 * Rounds a number to a specified number of decimal places.
 * @param {number} num The number to round.
 * @param {number} decimals The number of decimal places to round to.
 * @returns {number} The rounded number.
 */
const roundTo = (num, decimals = 2) => {
    const multiplier = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * multiplier) / multiplier;
  };

  module.exports = { roundTo };