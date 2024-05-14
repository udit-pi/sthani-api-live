const express = require('express');
const authenticateToken = require('../../middlewares/customerAuth');


const homeController = require('../../controllers/store/home.controller');
const router = express.Router();

router.get('/widgets', homeController.getwidgets);

module.exports = router;