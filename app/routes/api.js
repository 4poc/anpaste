var sprintf = require('sprintf').sprintf;
var util = require('util');
var fs = require('fs');
var _ = require('underscore');
var logger = require('../lib/log.js');

var config = require('../lib/config.js');

var Paste = require('../models/paste.js').Paste;

// the REST API documented here:
// https://github.com/4poc/anpaste/wiki/REST-API

exports.list = function (req, res, next) {
  var start = parseInt(req.query.start, 10) || 0;
  var max = parseInt(req.query.max, 10) || config.api.max;
  Paste.list(start, max, {encrypted: false, private: false}, function (err, pastes) {
    res.type('json');
    res.json(_.map(pastes, function (paste) { 
      return _.pick(paste, ['id', 'summary', 'content', 'language', 'created', 'expire']);
    }));
  });
};

exports.readPaste = function (req, res, next) {
  var id = req.params.id;
  Paste.getById(id, function (err, paste) {
    if (err) return next(err);
    res.type('json');
    res.json(_.pick(paste, ['id', 'summary', 'content', 'language', 'created', 'expire']));
  });
};
             
exports.createPaste = function (req, res, next) {
  var obj = req.body;

  if (_.keys(req.files).length > 0) {
    var file = req.files[_.keys(req.files)[0]];
    obj.summary = file.name;
    obj.stream = fs.createReadStream(file.path);
  } // read file upload as content/ filename as summary

  var paste = new Paste(obj);
  paste.save(function (err) {
    if (err != null) return next(err);

    logger.info('api: created new paste id=%s', paste.id);

    // IRC announce
    if (req.body.announce == 'true')
      paste.announce();

    res.type('json');
    res.json({id: paste.id, secret: paste.secret, url: paste.getUrl()});
  });
};
             
exports.updatePaste = function (req, res, next) {
  var obj = req.body;
  obj.id = req.params.id;

  if (_.keys(req.files).length > 0) {
    var file = req.files[_.keys(req.files)[0]];
    obj.summary = file.name;
    obj.stream = fs.createReadStream(file.path);
  } // read file upload as content/ filename as summary

  var paste = new Paste(obj);

  // updates the paste (secret must match)
  paste.save(function (err) {
    if (err != null) return next(err);
    logger.info('api: paste updated id=%s', obj.id);
    res.type('json');
    res.json({id: paste.id, url: paste.getUrl()});
  });
};
             
exports.deletePaste = function (req, res, next) {
  Paste.getById(req.params.id, function (err, paste) {
    if (err != null) return next(err);
    if (req.body.secret !== paste.secret)
      return next(new Error('wrong secret'));
    paste.delete(function (err) {
      if (err != null) return next(err);
      logger.info('api: paste deleted, id=%s', req.params.id);
      res.type('json');
      res.json({id: paste.id});
    });
  });
};
             


