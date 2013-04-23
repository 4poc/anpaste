
var logger = require('./log.js');
var dgram = require('dgram');
var config = require('../../config.json');

exports.announce = function (text) {
  var message = new Buffer([config.announce.password, config.announce.channel, text].join('|'));
  console.log('send announce udp message: ' + message);
  var client = dgram.createSocket(config.announce.udp_proto);
  client.send(message, 0, message.length, config.announce.port, config.announce.host, function(err, bytes) {
    client.close();
  });
};

