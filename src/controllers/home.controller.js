const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { homeService } = require('../services');


const createHome = catchAsync(async (req, res) => {
   
//   console.log(req.body)
//   console.log(req.files.logo[0].filepath)
try {
  const home = await homeService.saveHome(req);
  res.status(httpStatus.CREATED).send(home);
} catch (err) {
    res.status(400).json({ message: err.message });
}
   

});

const updateHome = catchAsync(async (req, res) => {
   
  try {
    const home = await homeService.updateWidgetById(req.params.widgetId, req);
   
    res.status(httpStatus.CREATED).send(home);
  } catch(err) {
    res.status(400).json({ message: err.message });
  }
})




const getwidgets = catchAsync(async (req, res) => {
  try {
    const filter = pick(req.query, ['name', 'role']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await homeService.queryWidgets(filter, options);
    // console.log(result)
    res.send(result);
  } catch(err) {
    throw err
  }
 

})

const getWidget = catchAsync(async (req, res) => {
  try {
    const widget = await homeService.getWidgetById(req.params.widgetId);
    if (!widget) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Widget not found');
    }
    res.send(widget);
  } catch(err) {
    throw err;
  }
 
});

const deleteWidget = catchAsync(async (req, res) => {
 
await homeService.deleteWidgetById(req.params.widgetId);
res.status(httpStatus.NO_CONTENT).json({'message': 'Widget deleted successfully'});
});


 

module.exports = {
    createHome,
    getwidgets,
    getWidget,
    updateHome,
    deleteWidget
   
}