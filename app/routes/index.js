var sprintf = require('sprintf').sprintf;
var util = require('util');
var _ = require('underscore');

var store = require('../lib/store.js');
var announce = require('../lib/announce.js').announce;
var config = require('../../config.json');

var brush = require('../../brush.json');
var lang_brush = {};
for (var i = 0; i < brush.length; i++) {
  lang_brush[brush[i][1]] = brush[i];
}

exports.index = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;

  var where = 'where (expire is null or expire > ?) and encrypted = 0 and private = 0 order by created desc';

  var now = new Date().getTime();

  // count all
  store.query('select count(*) as num from paste '+where, [now], function (err, rows) {
    if (err != null) return next(err);
    var all = rows[0].num;
    var num_pages = Math.floor(all / config.index.per_page);
    var start = num_pages * (page-1);

    store.query('select * from paste '+where+' limit '+start+','+config.index.per_page, [now], function (err, pastes) {
      if (err != null) return next(err);
      _.each(pastes, function (paste) {
        paste.created = new Date(parseInt(paste.created, 10));
        if (paste.expire)
          paste.expire = new Date(parseInt(paste.expire, 10));

        var content = paste.content.split('\n');
        paste.content = content.slice(0, config.index.max_lines).join('\n');
      });
      var brush_list = _.map(pastes, function (paste) {
        if (lang_brush[paste.language])
          return lang_brush[paste.language][0];
      });
      brush_list = _.uniq(brush_list);
      res.render('index', {num_pages:num_pages, all:all, page:page, brush_list: brush_list, pastes: pastes});
    });

  });


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
      var brush_list = ['shBrushPlain.js'];
      if (lang_brush[paste.language])
        brush_list = [lang_brush[paste.language][0]];
      else
        paste.language = 'plain';

      res.render('show', {brush_list: brush_list, paste: paste});
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

  req.session.test = true;

  res.render('create', {notice: notice});
};


exports.createPaste = function (req, res, next) {
  if (req.body.content.length == 0) throw new Error('content required');
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
    paste.expire = exp.getTime() + parseInt(req.body.expire, 10) * 1000;
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
  store.get(id, function (err, paste) {
    if (err != null) return next(err);
    if (secret !== paste.secret) return next(new Error('wrong secret'));
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

  store.get(paste.id, function (err, _paste) {
    if (err != null) return next(err);
    if (_paste.secret !== paste.secret) return next(new Error('wrong secret'));
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


exports.notFound = function (req, res, next) {
  res.status(404);
  res.render('not_found');
};






