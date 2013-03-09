var sprintf = require('sprintf').sprintf;
var util = require('util');

var store = require('../lib/store.js');
var announce = require('../lib/announce.js').announce;

var brush = require('../../brush.json');
var lang_brush = {};
for (var i = 0; i < brush.length; i++) {
  lang_brush[brush[i][1]] = brush[i];
}

exports.index = function (req, res, next) {
  res.redirect('/create');
};


exports.readPaste = function (req, res, next) {
  var id = req.params.id, format = req.params.format || 'html';
  store.get(id, function (err, paste) {
    if (err) return next();
    if (req.params.file) {
      format = 'raw';
      res.set('Content-Disposition', 'attachment; filename='+req.params.file);
    }

    if (format == 'html') {
      res.render('show', {lang_brush: lang_brush, paste: paste});
    }
    else if (format == 'raw') {
      res.set('Content-Type', 'text/plain; charset=utf-8; charset=utf-8');
      res.send(paste.content);
    }
  });
};


exports.createPasteForm = function (req, res) {
  var notice;

  if (typeof req.query.expired !== 'undefined') {
    notice = 'You were redirected because the post you looked at expired.';
  }

  res.render('create', {notice: notice});
};


exports.createPaste = function (req, res, next) {
  if (req.body.content.length == 0) throw new Error('content required');
  console.log(require('util').inspect(req.body));
  var paste = {
    summary: req.body.summary,
    content: req.body.content,
    expire: null,
    encrypted: req.body.encrypted === 'true' ? true : false,
    private: req.body.private === 'true' ? true : false,
    language: req.body.language
  };
  if (req.body.expire != '0') {
    var exp = new Date();
    exp.setTime(exp.getTime() + parseInt(req.body.expire, 10) * 1000);
    paste.expire = exp;
  }

  store.create(paste, function (err, paste) {
    if (err != null) return next(err);

    console.log('new paste created, id: ' + paste.id);

    if (req.body.announce == 'true') {
      var url = 'http://' + req.headers.host + '/' + paste.id;
      var message = 'new paste submitted :: ' + url;
      if (paste.summary != '') {
        message += ' :: ' + paste.summary;
      }
      announce(message);
    }

    if (req.xhr) {
      res.send({id: paste.id, secret: paste.secret});
    }
    else {          
      res.redirect(res.locals.url(['update', paste.id, paste.secret]));
    }
  });
};


exports.updatePasteForm = function (req, res, next) {
  var id = req.params.id, secret = req.params.secret;
  store.get(id, function (err, paste) {
    if (err != null) return next(err);
    if (secret !== paste.secret) return next(new Error('wrong secret'));
    console.log('TEST');
    console.log(util.inspect(paste));
    res.render('update', {paste: paste});
  });
};


exports.updatePaste = function (req, res, next) {
  var paste = {
    id: req.body.id,
    secret: req.body.secret,
    summary: req.body.summary,
    content: req.body.content,
    language: req.body.language
  };

  store.get(id, function (err, paste) {
    if (err != null) return next(err);
    if (secret !== paste.secret) return next(new Error('wrong secret'));
    store.update(paste, function (err) {
      if (err != null) return next(err);
      if (req.xhr) {
        res.send({id: paste.id, secret: paste.secret});
      }
      else {
        res.redirect(res.locals.url(['update', paste.id, paste.secret]));
      }
    });
  });
};


exports.deletePasteForm = function (req, res, next) {
  store.get(req.params.id, function (err, paste) {
    if (err != null) return next(err);
    if (req.params.secret !== paste.secret)
      return next(new Error('wrong secret'));
    res.render('delete', {paste: paste});
  });
};


exports.deletePaste = function (req, res, next) {
  store.get(req.body.id, function (err, paste) {
    if (err != null) return next(err);
    if (req.body.secret !== paste.secret)
      return next(new Error('wrong secret'));
    store.delete(req.body.id, function (err) {
      if (err != null) return next(err);
      res.redirect('/');
    });
  });
};






