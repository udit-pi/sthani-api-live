const express = require('express');

const authRoute = require('./authRoute');
const productRoute = require('./productRoute');
const customerRoute = require('./customerRoute');
const homeRoute = require('./homeRoute');

const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [

 
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/products',
    route: productRoute
  },
  {
    path: '/customer',
    route: customerRoute
  },
  {
    path: '/home',
    route: homeRoute
  }
  
];


defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});



module.exports = router;
