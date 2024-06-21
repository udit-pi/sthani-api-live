const mapOrderStatus = (status) => {
    switch (status) {
      case 'Unfulfilled':
        return 'Order Placed';
      case 'Fulfilled':
        return 'Packed';
      case 'Shipped':
        return 'Shipped';
      case 'Delivered':
        return 'Delivered';
      case 'Cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  module.exports = mapOrderStatus;