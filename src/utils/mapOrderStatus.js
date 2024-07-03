const mapOrderStatus = (status) => {
    switch (status) {
      case 'Pending':
        return 'Order Placed';
      case 'Confirmed':
          return 'Confirmed';
      case 'Packed':
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