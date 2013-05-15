var net = require('net');
var util = require('util');
var _ = require('underscore');
var logger = require('./log.js');

var config = require('../../config.json');

var Paste = require('../models/paste.js').Paste;

exports.create = function () {
  var handler = function (conn) {
    logger.info('new TCP connection from ' + conn.remoteAddress);

    conn.setEncoding('UTF-8');
    conn.pause();

    Paste.claimId(16, function (err, id) {
      if (err) {
        logger.error('TCP service error in id claim: %s', err);
        conn.destroy();
        return;
      }

      conn.write(config.tcpsrv.reply + id + '\r\n');
      conn.resume();

      var paste = new Paste({stream: conn, private: true});
      paste.save(id, function (err) {
        if (err) {
          logger.error('TCP service error in saving paste (id=%s)', id);
          logger.error(err);
          return;
        }
        logger.info('paste created over TCP service, (id=%s)', id);
      });
    });
  };

  _.each(config.tcpsrv.bind, function (host) {
    var server = net.createServer(handler);
    server.listen(config.tcpsrv.port, host, function () {
      var addy = server.address();
      logger.info('TCP service listening %s: [%s]:%d', addy.family, addy.address, addy.port);
    });
  });
};




