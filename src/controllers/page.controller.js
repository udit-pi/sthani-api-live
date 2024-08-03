const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { pageService } = require('../services');

const createPage = catchAsync(async (req, res) => {
  const page = await pageService.createPage(req.body);
  res.status(httpStatus.CREATED).send(page);
});

const getPages = catchAsync(async (req, res) => {
  const pages = await pageService.queryPages();
  res.send(pages);
});

const getPage = catchAsync(async (req, res) => {
  const page = await pageService.getPageBySlug(req.params.slug);
  if (!page) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Page not found' });
  } else {
    res.send(page);
  }
});

const updatePage = catchAsync(async (req, res) => {
  const page = await pageService.updatePageBySlug(req.params.slug, req.body);
  res.send(page);
});

const deletePage = catchAsync(async (req, res) => {
  await pageService.deletePageBySlug(req.params.slug);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createPage,
  getPages,
  getPage,
  updatePage,
  deletePage
};
