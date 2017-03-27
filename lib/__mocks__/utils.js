const utils = jest.genMockFromModule('./utils');

utils.readJsonFile = jest.fn();

module.exports = utils;
