var sprintf = require('sprintf').sprintf;
var util = require('util');
var fs = require('fs');
var _ = require('underscore');
var logger = require('../lib/log.js');

var config = require('../lib/config.js');

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
  var counting = {all: 0, approved: 0, spam: 0};
  Paste.countAllPublic(function (err, count) {
    counting.all = count;
    Paste.countAllPublic({encrypted: false, private: false, status: Paste.STATUS_SPAM}, function (err, count) {
      counting.spam = count;
      Paste.countAllPublic({encrypted: false, private: false, status: Paste.STATUS_APPROVED}, function (err, count) {
        counting.approved = count;

        Paste.page(page, 250, function (err, pastes, pages) {
            if (err) return next(err);

            res.render('admin/list', {pastes: pastes, page: page, pages: pages, counting: counting});
        }, {not_status: undefined, status: req.session.list_filter});
      });
    });
  });
};

exports.bulk = function (req, res, next) {
  var selection = req.body.selection, action;
  if (!_.isArray(selection)) {
    selection = [selection];
  }
  if (req.body.action_submit)
    action = req.body.action;
  else
    action = req.body.action2;

  if (action == 'delete') {
    Paste.deleteByIds(selection, function (err) {
      if (err) {
        return next('error deleting: ' + err);
      }
      res.redirect('/admin/list');
    });
  }
  else if (action == 'approve' || action == 'spam') {
    var status = (action == 'approve') ? Paste.STATUS_APPROVED : Paste.STATUS_SPAM;
    Paste.markByIds(selection, status, function (err) {
      if (err) {
        return next('error marking: ' + err);
      }
      res.redirect('/admin/list');
    });
  }
  else {
    res.redirect('/admin/list');
  }
};

exports.parseStatus = function (req, res, next) {
  var status = req.params.status;
  switch (req.params.status) {
  case 'all':
    req.paste_status = null;
    break;
  case 'unchecked':
    req.paste_status = Paste.STATUS_UNCHECKED;
    break;
  case 'approved':
    req.paste_status = Paste.STATUS_APPROVED;
    break;
  case 'spam':
    req.paste_status = Paste.STATUS_SPAM;
    break;
  }
  next();
};

exports.listFilter = function (req, res, next) {
  req.session.list_filter = req.paste_status;
  res.redirect('/admin/list');
};

exports.markPaste = function (req, res, next) {
  Paste.getById(req.params.id, function (err, paste) {
    if (err) {
      return next(new Error('unable to mark paste ' + err));
    }

    paste.status = req.paste_status;
    paste.save(function (err) {
      if (err) {
        return next(new Error('unable to mark paste ' + err));
      }
      res.redirect('/admin/list');
    });
  });
};

