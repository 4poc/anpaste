var sprintf = require('sprintf').sprintf;
var util = require('util');
var fs = require('fs');
var _ = require('underscore');
var logger = require('../lib/log.js');

var config = require('../../config.json');

var Paste = require('../models/paste.js').Paste;

exports.loginForm = function (req, res, next) {
  res.render('admin/login');
};

exports.login = function (req, res, next) {
  if (req.body.password === config.admin_pw) {
    req.session.admin = true;
    logger.info('admin logged in');
    res.redirect('/admin');
  }
  else {
    next('login failure');
  }
};

exports.logout = function (req, res, next) {
  req.session.admin = false;
  logger.info('admin logout');
  res.redirect('/admin');
};

exports.authTest = function (req, res, next) {
  if (!req.session.admin) {
    res.redirect('/admin');
  }
  else {
    next();
  }
};

exports.list = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  Paste.page(page, 250, function (err, pastes, pages) {
      if (err) return next(err);

      res.render('admin/list', {pastes: pastes, page: page, pages: pages});
  }, {not_status: undefined});
};

exports.bulk = function (req, res, next) {
  var selection = req.body.selection;
  if (!_.isArray(selection)) {
    selection = [selection];
  }

  if (req.body.bulk_delete) {
    Paste.deleteByIds(selection, function (err) {
      if (err) {
        return next('error deleting: ' + err);
      }
      res.redirect('/admin/list');
    });
  }
  else {
    res.redirect('/admin/list');
  }
};

