
var net = require('net');
var _ = require('underscore');

var store = require('./store.js');
var config = require('../../config.json');

exports.create = function () {
  var handler = function (conn) {
    console.log('tcpsrv new client connection ' + conn.remoteAddress);

    conn.setEncoding('UTF-8');
    conn.pause();
    // reserve ID
    store.createId(16, function (err, id) {
      if (err) {
        console.log('tcpsrv error occured: ' + err);
        conn.destroy();
        return;
      }

      conn.write(config.tcpsrv.reply + id + '\r\n');
      conn.resume();

      var content = '';
      conn.on('data', function (data) {
        content += data;
      });
      conn.on('close', function () {
        if (content.length > 0) {
          console.log('tcpsrv save new paste with id ' + id);
          store.createWithId(id, content, function (err, paste) {});
        }
      });
    });
  };

  _.each(config.tcpsrv.bind, function (host) {
    var server = net.createServer(handler);
    server.listen(config.tcpsrv.port, host, function () {
      var addy = server.address();
      console.log('tcpsrv server listening ' + addy.family + '/' + addy.address + ':' + addy.port);
    });
  });
};




