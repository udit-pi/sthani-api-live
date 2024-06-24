const MEDIA_URL = process.env.MEDIA_URL;

const prepareOrderItems = (items) => {

    if (!Array.isArray(items)) {
      return [];
    }
  
    return items.map(item => {
      const {
        variant: { _id, ...variantRest },
        productId,
        name,
        sku,
        image,
        quantity,
        price,
        discounted_price,
        total
      } = item;
  
      return {
        variant: {
          ...variantRest,
          variant_id: _id,
          image: variantRest.image || variantRest.image=="undefined" ? `${MEDIA_URL}${variantRest.image}` : ""
        },
        productId,
        name,
        sku,
        image: `${MEDIA_URL}${image}`,
        quantity,
        price,
        discounted_price,
        total
      };
    });
  }

  
  module.exports = { prepareOrderItems };