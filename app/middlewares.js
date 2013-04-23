
var logger = require('./lib/log.js');
module.exports = {
  requestLogger: function (req, res, next) {
    var start = new Date().getTime();

    var end = res.end;
    res.end = function (chunk, encoding) {
      res.end = end;
      res.end(chunk, encoding);

      var stop = new Date().getTime();
      var duration = stop - start;

      var ip = null;
      if (req.ip) ip = req.ip;
      if (req.socket.socket) ip = req.socket.socket.remoteAddress;

      logger.log('debug', '%s - "%s %s HTTP/%s" %d - %dms',  
        ip, req.method, req.originalUrl || req.url, req.httpVersion, res.statusCode, duration);
    };
    next();
  }
};

