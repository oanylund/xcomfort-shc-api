
const init = jest.genMockFromModule('./init');

init.initialSetup = jest.fn();
init.importSetup = jest.fn();

module.exports = init;
