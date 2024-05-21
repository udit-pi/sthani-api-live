const express = require('express');
const { getSearch } = require('../../controllers/store/search.controller');

const authenticateToken = require('../../middlewares/customerAuth');

const router = express.Router();


router.post('/',authenticateToken, getSearch); 



module.exports = router;

