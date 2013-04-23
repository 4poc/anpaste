var config = require('../../config.json');

// Configure logging
var winston = require('winston');
var customLevels = {
  levels: {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4
  },
  colors: {
    trace: 'cyan',
    debug: 'blue',
    info: 'green',
    warn: 'yellow',
    error: 'red'
  }
};

var logger = new (winston.Logger)({ levels: customLevels.levels });
winston.addColors(customLevels.colors);

logger.add(winston.transports.Console, config.logger.console);
logger.add(winston.transports.File, config.logger.file);

logger.debug('debug test log message: service startup');

module.exports = logger;

