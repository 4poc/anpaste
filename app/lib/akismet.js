var util = require('util');
var sprintf = require('sprintf').sprintf;
var logger = require('./log.js');
var config = require('../../config.json');
var request = require('request').defaults({proxy: config.akismet.proxy});
var Paste = require('../models/paste.js').Paste;


var verified = false;
if (config.akismet.apiKey) {
  request.post('http://rest.akismet.com/1.1/verify-key', {form: {
      key: config.akismet.apiKey,
      blog: config.akismet.blog
  }}, function (err, resp, body) {
    if (body == 'valid') {
      logger.info('akismet key verified.');
      verified = true;
    }
    else {
      logger.warn('akismet key not verified!');
    }
  });
}

exports.check = function (paste, req, callback) {
  if (!verified) return callback('akismet key not verified!');
  var url = sprintf('http://%s.rest.akismet.com/1.1/comment-check', config.akismet.apiKey);

  var ip = null;
  if (req.ip) ip = req.ip;
  if (req.socket.socket) ip = req.socket.socket.remoteAddress;
  var post_check = { 
      blog: config.akismet.blog,
      user_ip: ip,
      user_agent: req.get('user-agent'),
      referrer: req.get('referer'),
      comment_content: paste.getExcerpt()
  };
  logger.trace('akismet testing: ' + util.inspect(request));
  request.post(url, {form: post_check}, function (err, resp, body) {
    var spam = (body == 'true');
    if (spam)
      logger.info('akismet detected spam: ' + paste.id);

    paste.status = spam ? Paste.STATUS_SPAM : Paste.STATUS_APPROVED;
    paste.save(callback);
  });
};

