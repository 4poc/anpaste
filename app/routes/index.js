var sprintf = require('sprintf').sprintf;
var util = require('util');
var _ = require('underscore');
var logger = require('../lib/log.js');

var config = require('../../config.json');

var Paste = require('../models/paste.js').Paste;

exports.index = function (req, res, next) {
  res.redirect('/create');
};

exports.list = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  Paste.page(page, function (err, pastes, pages) {
      if (err) return next(err);

      // create a uniq list of brushes used in the resulting pastes
      var brushes = [];
      _.each(pastes, function (paste) {
        if (!_.contains(brushes, paste.getBrushFile()))
          brushes.push(paste.getBrushFile());
      });

      res.render('list', {pastes: pastes, page: page, pages: pages, brushes: brushes})
  });
};


exports.readPaste = function (req, res, next) {
  var id = req.params.id, format = req.params.format || 'html';
  Paste.getById(id, function (err, paste) {
    if (err) return next();
    if (req.params.file) {
      format = 'raw';
      res.set('Content-Disposition', 'attachment; filename='+req.params.file);
    }

    if (format == 'html') {
      res.render('show', {paste: paste, brushes: [paste.getBrushFile()]});
    }
    else if (format == 'raw') {
      res.set('Content-Type', 'text/plain; charset=utf-8; charset=utf-8');
      res.send(paste.getContent());
    }
  });
};


exports.createPasteForm = function (req, res) {
  var notice;

  if (typeof req.query.expired !== 'undefined') {
    notice = 'You were redirected because the post you looked at expired.';
  }

  req.session.test = true;

  res.render('create', {notice: notice});
};


exports.createPaste = function (req, res, next) {
  var paste = new Paste(req.body);

  // remember the paste settings in the session
  if (req.body.expire != '0') {
    req.session.option_expire = req.body.expire;
  }
  _.extend(req.session, {
    option_language: paste.language,
    option_private: paste.private,
    option_announce: req.body.announce
  });

  paste.save(function (err) {
    if (err != null) return next(err);

    console.log('new paste created, id: ' + paste.id);

    // IRC announce
    if (req.body.announce == 'true')
      paste.announce();

    // store secret in session data
    if (!req.session.secrets) {
      req.session.secrets = {};
    }
    req.session.secrets[paste.id] = paste.secret;

    if (req.xhr) {
      res.send({id: paste.id, secret: paste.secret});
    }
    else {          
      if (req.session.test) {
        res.redirect(res.locals.url([paste.id]));
      }
      else {
        res.redirect(res.locals.url(['update', paste.id, paste.secret]));
      }
    }
  });
};


exports.updatePasteForm = function (req, res, next) {
  var id = req.params.id, secret = req.params.secret;
  Paste.getById(id, function (err, paste) {
    if (err != null) return next(err);
    if (secret !== paste.secret) return next(new Error('wrong secret'));
    res.render('update', {paste: paste});
  });
};


exports.updatePaste = function (req, res, next) {
  var paste = new Paste(req.body);

  // remember settings
  req.session.option_language = paste.language;

  // updates the paste (secret must match)
  paste.save(function (err) {
    if (err != null) return next(err);
    if (req.xhr) {
      res.send({id: paste.id, secret: paste.secret});
    }
    else {
      if (req.session.test) {
        res.redirect(res.locals.url([paste.id]));
      }
      else {
        res.redirect(res.locals.url(['update', paste.id, paste.secret]));
      }
    }
  });
};


exports.deletePasteForm = function (req, res, next) {
  Paste.getById(req.params.id, function (err, paste) {
    if (err != null) return next(err);
    if (req.params.secret !== paste.secret)
      return next(new Error('wrong secret'));
    res.render('delete', {paste: paste});
  });
};


exports.deletePaste = function (req, res, next) {
  Paste.getById(req.body.id, function (err, paste) {
    if (err != null) return next(err);
    if (req.body.secret !== paste.secret)
      return next(new Error('wrong secret'));
    paste.delete(function (err) {
      if (err != null) return next(err);
      res.redirect('/');
    });
  });
};


exports.settings = function (req, res, next) {
  if (!_.isUndefined(req.body.show_line_numbers))
    req.session.show_line_numbers = req.body.show_line_numbers==='true';

  if (_.contains(config.themes, req.body.show_theme))
    req.session.show_theme = req.body.show_theme;

  if (!_.isUndefined(req.body.option_tabkeys))
    req.session.option_tabkeys = req.body.option_tabkeys==='true';

  res.send({status: 'ok'});
};


exports.about = function (req, res, next) {
  res.render('about');
};


exports.notFound = function (req, res, next) {
  res.status(404);
  if (req.path.match(/^\/api/i))
    res.json({error: 'resource not found'});
  else
    res.render('not_found');
};






