const httpStatus = require('http-status');
const Page = require('../models/page.model');
const ApiError = require('../utils/ApiError');

const createPage = async (pageBody) => {
  const page = new Page(pageBody);
  await page.save();
  return page;
};

const queryPages = async () => {
  return Page.find({});
};

const getPageBySlug = async (slug) => {
  const page = await Page.findOne({ slug });
  if (!page) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Page not found');
  }
  return page;
};

const updatePageBySlug = async (slug, updateBody) => {
  const page = await Page.findOneAndUpdate({ slug }, updateBody, { new: true });
  if (!page) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Page not found');
  }
  return page;
};

const deletePageBySlug = async (slug) => {
  const page = await Page.findOneAndDelete({ slug });
  if (!page) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Page not found');
  }
  return page;
};

module.exports = {
  createPage,
  queryPages,
  getPageBySlug,
  updatePageBySlug,
  deletePageBySlug
};
