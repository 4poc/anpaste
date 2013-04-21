var sprintf = require('sprintf').sprintf;
var util = require('util');
var _ = require('underscore');

var config = require('../../config.json');

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
    if (err) return next();
    res.type('json');
    res.json(_.pick(paste, ['id', 'summary', 'content', 'language', 'created', 'expire']));
  });
};
             
exports.createPaste = function (req, res, next) {
  var paste = new Paste(req.body);
  paste.save(function (err) {
    if (err != null) return next(err);

    console.log('new paste created, id: ' + paste.id);

    // IRC announce
    if (req.body.announce == 'true')
      paste.announce();

    res.type('json');
    res.json({id: paste.id, secret: paste.secret});
  });
};
             
exports.updatePaste = function (req, res, next) {
  var paste = new Paste(req.body);

  // updates the paste (secret must match)
  paste.save(req.body.id, function (err) {
    if (err != null) return next(err);
    res.type('json');
    res.json({id: paste.id, secret: paste.secret});
  });
};
             
exports.deletePaste = function (req, res, next) {
  Paste.getById(req.body.id, function (err, paste) {
    if (err != null) return next(err);
    if (req.body.secret !== paste.secret)
      return next(new Error('wrong secret'));
    paste.delete(function (err) {
      if (err != null) return next(err);
      res.type('json');
      res.json({id: paste.id});
    });
  });
};
             


