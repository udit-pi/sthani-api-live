const express = require('express');

const authRoute = require('./authRoute');
const productRoute = require('./productRoute');
const categoryRoute=require("./categoryRoute")
const customerRoute = require('./customerRoute');
const homeRoute = require('./homeRoute');
const config = require('../../config/config');
const brandRoute=require('../store/brandsRoute')
const SearchRoute=require('../store/searchRoute')
const FilterRoute=require('../store/filter.Route')
const shippingrateRoute=require('../store/shippingrateRoute')

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
    path: '/brand',
    route: brandRoute
  },
  {
    path: '/search',
    route: SearchRoute
  },
  {
    path: '/filters',
    route: FilterRoute
  },
  {
    path: '/customer',
    route: customerRoute
  },
  {
    path: '/home',
    route: homeRoute
  },
  {
    path: '/shippingrate',
    route: shippingrateRoute
  }
];


defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});



module.exports = router;