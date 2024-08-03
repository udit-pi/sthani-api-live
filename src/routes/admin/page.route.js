const express = require('express');
const auth = require('../../middlewares/auth');


const pageController = require('../../controllers/page.controller');

const router = express.Router();

router.route('/')
  .post(auth('managePages'), pageController.createPage)
  .get(auth('managePages'), pageController.getPages);

router.route('/:slug')
  .get(auth('managePages'), pageController.getPage)
  .patch(auth('managePages'), pageController.updatePage)
  .delete(auth('managePages'), pageController.deletePage);

module.exports = router;
