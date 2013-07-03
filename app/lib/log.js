var util = require('util');
var _ = require('underscore');
var config = require('./config.js');

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

// monkey patch custom level-helper methods
_.each(_.keys(customLevels.levels), function (level) {
  logger[level] = function () {
    var args = _.values(arguments);

    // use stack for errors:
    if (args.length == 1 && args[0] instanceof Error)
      args[0] = args[0].stack;

    // if the log message contains a newline, split into
    // multiple messages
    if (args.length == 1 && args[0].indexOf('\n') !== -1) {
      _.each(args[0].split('\n'), function (line) {
        logger[level](line);
      });
    }
    else {
      this.log.apply(logger, [level].concat(args));
    }
  }.bind(logger);
});

logger.add(winston.transports.Console, config.logger.console);
logger.add(winston.transports.File, config.logger.file);

logger.debug('debug test log message: service startup');

module.exports = logger;

