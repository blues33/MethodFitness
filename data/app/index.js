let config = require('config');

module.exports = (function(_options) {
  var options = {};
  Object.assign(options, config.get('configs') || {}, _options || {});
  const container = require('./registry')(options);
  const bootstrap = container.getInstanceOf('bootstrap');
  bootstrap().then(() => process.exit()); // eslint-disable-line no-process-exit
})();
