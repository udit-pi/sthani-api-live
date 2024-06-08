


exports.filters=(productsQuery, query = {}, filterData = {})=>{
  const pageSize = 10; // Number of products per page
  let pageNumber = 1;
const { sort,page} = query;
const {brand_ids,category_ids,price_min,price_max}=filterData

console.log("---------")
console.log(brand_ids)
console.log("---------")
let sortedProducts = [...productsQuery];

const brandIdsSet = new Set(brand_ids);
const categoyIdsSet = new Set(category_ids);


// Filter products based on brand_ids
if (brandIdsSet.size > 0) {
    console.log("filter brands")
    console.log(brandIdsSet)
    // sortedProducts = sortedProducts.filter(product => brandIdsSet.has(product.brand_id.toString()));
    sortedProducts = sortedProducts.filter(product => product.brand_id && brandIdsSet.has(product.brand_id._id.toString()));
}
if (categoyIdsSet.size > 0) {

    sortedProducts = sortedProducts.filter(product => {
        for (const category of product.categories) {
            if (categoyIdsSet.has(category.toString())) {
                return true;
            }
        }
        return false;
    });
    



}

// if (search_keyword) {
//     const keywordRegExp = new RegExp(search_keyword, 'i'); //its for a  Case-insensitive search
//     sortedProducts = sortedProducts.filter(product => keywordRegExp.test(product.name) || keywordRegExp.test(product.description));
// }

// if (search_keyword) {
   
//     const escapedKeyword = search_keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    

//     const keywordRegExp = new RegExp(escapedKeyword.split('').join('.*'), 'i'); // Case-insensitive search
    

//     sortedProducts = sortedProducts.filter(product => keywordRegExp.test(product.name) || keywordRegExp.test(product.description));
// }


if (price_min !== undefined && price_max !== undefined) sortedProducts = sortedProducts.filter(product => product.price >= price_min && product.price <= price_max);

//    //Sort the product according to price or created date 

if (sort) {
    switch (sort) {
        case 'new':
            sortedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'price_low_to_high':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price_high_to_low':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
        case 'discounted':
            sortedProducts.sort((a, b) => (b.discounted_price || 0) - (a.discounted_price || 0));
            break;
        default:
            break;
    }
}
 //Pagination 
 if (page) {
  pageNumber = parseInt(page);
}
if (pageSize) {
  const startIndex = (pageNumber - 1) * parseInt(pageSize);
  const endIndex = startIndex + parseInt(pageSize);
  sortedProducts = sortedProducts.slice(startIndex, endIndex);
}
    return {sortedProducts ,page:pageNumber}
}









//filter product category
// exports.filterProducts = async (category_id,query,filterData) => {

//   const {page } = query;
//   const pageSize = 10; // Number of products per page
//   let pageNumber = 1;
  
//   // Find the category by ID
//     const category = await Category.findById(category_id);
//     if (!category)throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');

//     let productsQuery = Product.find({ categories: category_id });



//     //filter the product according to filter
    
//    let FilterProducts=filters(productsQuery,query,filterData)
 
 
//      //Pagination 



//       if (page) {
//         pageNumber = parseInt(page);
//       }
//       FilterProducts = FilterProducts.skip((pageNumber - 1) * pageSize).limit(pageSize);

//       const products = await FilterProducts.exec();

//      //finnaly return to the controllers 
//     return { category, products, page: pageNumber};

// };



