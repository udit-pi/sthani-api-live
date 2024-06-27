exports.filters = (productsQuery, query = {}, filterData = {}) => {
    const pageSize = 10; // Number of products per page
    let pageNumber = 1;
    const { sort, page } = query;
    const { brand_ids, category_ids, price_min, price_max } = filterData;

    console.log("Initial Products Count:", productsQuery.length);
    productsQuery.forEach(product => {
        console.log(`Product Name: ${product.name}, Brand ID: ${product.brand_id ? product.brand_id._id : 'No Brand'}, Categories: ${product.categories}`);
    });

    let sortedProducts = [...productsQuery];

    // Convert brand_ids and category_ids to ObjectIds
    const brandIdsSet = new Set(brand_ids?.map(id => id.toString()));
    const categoryIdsSet = new Set(category_ids?.map(id => id.toString()));

    // Filter products based on brand_ids
    if (brandIdsSet.size > 0) {
        sortedProducts = sortedProducts.filter(product => 
            product.brand_id && brandIdsSet.has(product.brand_id._id.toString())
        );
        console.log("Filtered Products by Brand Count:", sortedProducts.length);
        sortedProducts.forEach(product => {
            console.log(`Filtered Product by Brand: ${product.name}, Brand ID: ${product.brand_id._id}`);
        });
    }

    // Filter products based on category_ids
    if (categoryIdsSet.size > 0) {
        sortedProducts = sortedProducts.filter(product =>
            product.categories.some(category => categoryIdsSet.has(category.toString()))
        );
        console.log("Filtered Products by Category Count:", sortedProducts.length);
        sortedProducts.forEach(product => {
            console.log(`Filtered Product by Category: ${product.name}, Categories: ${product.categories}`);
        });
    }

     // Filter by price range
     if (price_min !== undefined) {
        sortedProducts = sortedProducts.filter(product => product.price >= price_min);
    }
    if (price_max !== undefined) {
        sortedProducts = sortedProducts.filter(product => product.price <= price_max);
    }

    // Sorting
    if (sort) {
        switch (sort) {
            case 'new':
                sortedProducts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                break;
            case 'price_low_to_high':
                sortedProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price_high_to_low':
                sortedProducts.sort((a, b) => b.price - a.price);
                break;
            case 'discounted':
                sortedProducts.sort((a, b) => (b.discounted_price || b.price) - (a.discounted_price || a.price));
                break;
        }
    }

    // Pagination
    if (page) {
        pageNumber = parseInt(page, 10);
    }
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    sortedProducts = sortedProducts.slice(startIndex, endIndex);

    console.log("Final Sorted Products Count:", sortedProducts.length);
    return { sortedProducts, page: pageNumber };
};
