const express = require('express');

const authRoute = require('./authRoute');
const productRoute = require('./productRoute');
const categoryRoute=require("./categoryRoute")
const config = require('../../config/config');
const brandRoute=require('../store/brandsRoute')
const SearchRoute=require('../store/searchRoute')

const router = express.Router();

const defaultRoutes = [

 
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/product',
    route: productRoute
  },

  {
    path: '/category',
    route: categoryRoute
  },

  {
    path: '/brands',
    route: brandRoute
  },
  {
    path: '/search',
    route: SearchRoute
  }

];


defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});



module.exports = router;
