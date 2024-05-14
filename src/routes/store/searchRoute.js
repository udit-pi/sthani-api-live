const express = require('express');
const { getSearch } = require('../../controllers/store/search.controller');



const router = express.Router();


router.post('/', getSearch); 



module.exports = router;

