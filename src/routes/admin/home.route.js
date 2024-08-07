const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const homeValidation = require('../../validations/home.validation');
const homeController = require('../../controllers/home.controller');
// const multer = require('multer');
// var upload = multer();
// const {imageUpload} = require('../../services/fileUpload.service')

const router = express.Router();

router
  .route('/')
  .post(auth('manageHome'),homeController.createHome)
  .get(auth('getWidgets'), homeController.getwidgets);

  router
  .route('/:widgetId')
  .get(auth('getWidgets'), homeController.getWidget)
  .patch(auth('manageHome'), validate(homeValidation.updateHome),homeController.updateHome)
  .delete(auth('manageHome'), validate(homeValidation.deleteWidget), homeController.deleteWidget);

router
  .route('/:widgetId/status')
  .patch(auth('manageHome'), validate(homeValidation.updateStatus), homeController.updateWidgetStatus);

module.exports = router;
 