var config = require('../../config.json');
var logger = require('./log.js');
var util = require('util');
var akismet = require('akismet').client(config.akismet);
var Paste = require('../models/paste.js').Paste;

if (config.akismet.apiKey) {
  akismet.verifyKey(function (err, verified) {
    if (verified) {
      logger.info('akismet key verified.');
    }
    else {
      logger.warn('akismet key not verified!');
      akismet = null;
    }
  });
}
else {
  akismet = null;
}

exports.check = function (paste, req, callback) {
  if (!akismet) return callback('no akismet');
  var ip = null;
  if (req.ip) ip = req.ip;
  if (req.socket.socket) ip = req.socket.socket.remoteAddress;
  var request = { 
      user_ip: ip,
      user_agent: req.get('user-agent'),
      comment_content: paste.getExcerpt()
  };
  logger.trace('akismet testing: ' + util.inspect(request));
  akismet.checkSpam(request, function (err, spam) {
      if (spam)
        logger.info('akismet detected spam: ' + paste.id);

      paste.status = spam ? Paste.STATUS_SPAM : Paste.STATUS_APPROVED;
      paste.save(callback);
  });
};

