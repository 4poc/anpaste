var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var util = require('util');
var store = require('../lib/store.js');
var token = require('../public/js/token.js');
var config = require('../../config.json');
var brush = require('../../brush.json');
var announce = require('../lib/announce.js').announce;
var logger = require('../lib/log.js');

var wordlist = [];
var wordlist_path = path.resolve(__dirname, '../../wordlist');
_.each(fs.readFileSync(config.wordlist ? config.wordlist : wordlist_path
).toString().split('\n'), function (line) {
  var nonalpha = new RegExp('\\W', 'g');
  line = line.replace(nonalpha, '').toLowerCase(); // remove non-alpha
  if (line != '') wordlist.push(line);
});
logger.info('loaded %d words from wordlist %s', wordlist.length, (config.wordlist ?  config.wordlist : wordlist_path));

var brushList = {};
_.each(brush, function (b) {
  brushList[b[1]] = [b[2], b[0]];
});

function Paste(obj) {
  obj = obj || {};
  this.id = obj.id || null;
  this.status = obj.status || Paste.STATUS_UNCHECKED;

  if (_.isNull(this.id))
    this.secret = token.generate(16);
  else
    this.secret = obj.secret || null;

  this.username = obj.username || null;
  this.summary = obj.summary || null;

  this.stream = obj.stream;
  if (!this.stream) {
    this.content = obj.content;
  }

  // make sure expire and created are Date instances
  
  if (!_.isUndefined(obj.expire))
    var expire = parseInt(obj.expire, 10);

  // expire might be a timestamp _or_ a delta value
  if (expire > 0 && expire <= _.max(_.values(config.expire))) {
    this.expire = new Date((new Date()).getTime() + expire * 1000);
  }
  else if (expire > 0) {
    this.expire = new Date(expire);
  }
  else {
    this.expire = null;
  }

  if (!_.isUndefined(obj.created))
    this.created = new Date(parseInt(obj.created, 10));
  else
    this.created = new Date();

  this.language = 'plain';
  if (_.isString(this.language) && _.has(brushList, obj.language))
    this.language = obj.language;

  this.encrypted = obj.encrypted === 'true' || obj.encrypted === true || obj.encrypted === 1;
  this.private = obj.private === 'true' || obj.private === true || obj.private === 1;

  // not stored in db, just used in save() to determine way to generate id:
  this.wordids = obj.wordids === 'true' || obj.wordids === true || obj.wordids === 1;
}
exports.Paste = Paste;

Paste.STATUS_UNCHECKED = 0;
Paste.STATUS_APPROVED = 1;
Paste.STATUS_SPAM = 2;

Paste.getById = function (id, callback) {
  var sql = 'select * from paste where id = ? and ' + Paste.where();
  store.query(sql, [id], function (err, res) {
    if (err != null) return callback(err);
    if (res.length == 0) return callback(new Error('paste not found'));
    callback(null, new Paste(res[0]));
  });
};

Paste.list = function (start, max, cond, callback) {
  callback = _.isFunction(cond) ? cond : callback;
  var sql = 'select * from paste where ' + Paste.where(cond) + ' order by created desc limit ?, ?';
  store.query(sql, [start, max], function (err, res) {
    if (err != null) return callback(err);
    callback(null, _.map(res, function (paste) { return new Paste(paste); }));
  });
};

Paste.where = function (cond) {
  cond = _.isObject(cond) ? cond : {};
  cond = _.defaults(cond, {
      expired: false
  //    encrypted: false,
  //    private: false
  });

  var now = new Date().getTime();

  var where = [];
  if (cond.expired)
    where.push('(expire is not null and ' + now + ' > expire)');
  else if (cond.expired === false)
    where.push('(expire is null or expire > ' + now + ')');

  if (_.isBoolean(cond.encrypted))
    where.push('encrypted = ' + ((cond.encrypted) ? '1' : '0'));
  if (_.isBoolean(cond.private))
    where.push('private = ' + ((cond.private) ? '1' : '0'));
  if (_.isNumber(cond.not_status))
    where.push('status <> ' + cond.not_status);
  if (_.isNumber(cond.status))
    where.push('status = ' + cond.status);

  return where.join(' and ');
};

Paste.page = function (page, per_page, callback, _cond) {
  if (_.isFunction(per_page)) {
    callback = per_page;
    per_page = config.index.per_page;
  }
  var cond = {encrypted: false, private: false, not_status: Paste.STATUS_SPAM};
  if (_.isObject(_cond)) {
    cond = _.extend(cond, _cond);
  }

  logger.debug('Paste.page() per_page=%d', per_page);
  Paste.countAllPublic(function (err, all) {
    if (err != null) return next(err);
    if (per_page > all) per_page = all;
    var page_count = Math.ceil(all / per_page);
    var start = (page-1) * per_page;
    Paste.list(start, per_page, cond, 
      function (err, pastes) {
        callback(err, pastes, page_count);
    });
  });
};

Paste.exists = function (id, callback) {
  store.count('paste', 'id = ?', [id], function (err, count) {
      if (err != null) return callback(err, false);
      callback(null, count);
  });
};

Paste.countAll = function (callback) {
  store.count('paste', function (err, count) {
      if (err != null) return callback(err, false);
      callback(null, count);
  });
};

Paste.countAllPublic = function (callback) {
  store.count('paste', Paste.where({encrypted: false, private: false}), function (err, count) {
      if (err != null) return callback(err, false);
      callback(null, count);
  });
};

Paste.deleteByIds = function (ids, callback) {
  var where = _.map(ids, function (id) { return 'id = ?'; });
  var sql = 'delete from paste where ' + where.join(' or ');
  logger.trace('bulk delete query: ' + sql);
  store.query(sql, ids, callback);
};

Paste._claimedIds = [];

/**
 * Claim/reserve free id temporarily.
 *
 * Generates an id that is neither claimed nor present in the db,
 * call callback(err, id). min_len is the minimal token length.
 */
Paste.claimId = function (min_len, callback) {
  // generate id with the length determined by the amount of pastes
  var genid = function (count) {
    var len = Math.ceil(Math.log(count + 1) /
      Math.log(token.CHARS.length)), id;
    return token.generate(len); 
  }, id;
  store.count('paste', function (err, count_all) {
    if (err != null) return callback(err);
    var next = function () {
      id = genid(count_all);
      if (id.length < min_len) {
        id = token.generate(min_len);
      }
      if (_.contains(Paste._claimedIds, id))
        return next();
      Paste.exists(id, function (err, exists) {
        if (err != null) return callback(err);
        if (!exists) { // id is free
          Paste._claimedIds.push(id);
          return callback(null, id);
        }
        next();
      });
    };
    next();
  });
};

/**
 * Claim/reserve free wordid temporarily.
 *
 * Generates/claims a xkcd-style word ID:
 *  http://xkcd.com/936/
 *
 * min_len determines the minimum word count
 */
Paste.claimWordId = function (min_len, callback) {
  min_len = _.isFunction(min_len) ? 1 : min_len;
  callback = _.isFunction(min_len) ? min_len : callback;
  var generate = function (len) {
    var token = [];
    for (var i = 0; i < len; i++) {
      token.push(wordlist[Math.floor(Math.random() * wordlist.length)]);
    }
    return token.join('-') + ((len==1)?'-':'');
  };

  // generate id with the length determined by the amount of pastes
  var genid = function (count) {
    var len = Math.ceil(Math.log(count + 1) /
      Math.log(wordlist.length)), id;
    return [len, generate(len)];
  }, id;
  store.count('paste', function (err, count_all) {
    if (err != null) return callback(err);
    var next = function () {
      var pair = genid(count_all);
      var len = pair[0];
      id = pair[1];
      if (len < min_len) {
        id = generate(min_len);
      }
      if (_.contains(Paste._claimedIds, id))
        return next();
      Paste.exists(id, function (err, exists) {
        if (err != null) return callback(err);
        if (!exists) { // id is free
          Paste._claimedIds.push(id);
          return callback(null, id);
        }
        next();
      });
    };
    next();
  });
};

Paste.releaseId = function (id) {
  Paste._claimedIds = _.without(Paste._claimedIds, id);
};

/**
 * Inserts or updates the paste instance in the database.
 *
 * Insert by a random id or by the optionally provided id, otherwise
 * updates an existing record. Only set id to create a new paste
 * with that exact id.
 */
Paste.prototype.save = function (id, callback) {
  if (_.isFunction(id)) {
    callback = id;
    id = null;
  }
  var self = this;

  // this is done async: read the stream for the content
  if (this.stream) {
    this.content = '';
    this.stream.on('data', function (data) {
      self.content += data.toString();
    });
    this.stream.on('close', function () {
      if (self.content.length > 0) {
        next();
      }
      else {
        callback(new Error('paste upload failed!'));
      }
    });
  }
  else {
    next();
  }

  function next() {
    if (_.isEmpty(self.content))
      return callback(new Error('paste must have content!'));
    if (!_.isString(self.content))
      return callback(new Error('paste content must be a string!'));
    logger.info('create paste, content size: ' + self.content.length)

    if (self.id) { // update existing record
      logger.info('update existing id=%s', self.id);
      self._update(callback);
    }
    else { // insert new
      if (id) { // use the provided id
        self.id = id;
        logger.info('insert new with set id=%s', self.id);
        self._insert(callback);
      }
      else { // use a randomly generated new one
        var claimfn = Paste.claimId;
        var min_len = self.private ? 16 : 1;
        if (self.wordids) {
          claimfn = Paste.claimWordId;
          min_len = self.private ? 4 : 1;
        }
        logger.info('generate id via %s, min_len is %d', (self.wordids?'words':'chars'), min_len);
        claimfn(min_len, function (err, id) {
          if (err) return callback(err);
          self.id = id;
          logger.info('insert new with random id=%s', self.id);
          self._insert(callback);
        });
      }
    }
  }
};

Paste.prototype._insert = function (callback) {
  var obj = _.pick(this, ['id', 'secret', 'username', 'summary', 'content',
      'expire', 'created', 'encrypted', 'language', 'private', 'status']);
  logger.trace('paste insert: ' + util.inspect(obj));
  store.insert('paste', obj, callback);
};

/**
 * Updates an existing paste.
 * 
 * Only allows to edit summary, content and language.
 */
Paste.prototype._update = function (callback) {
  store.update('paste', _.pick(this, ['summary', 'content', 'language', 'status']), 
    {id: this.id, secret: this.secret}, callback);
};

Paste.prototype.delete = function (callback) {
  store.query('delete from paste where id = ?', this.id, callback);
};

Paste.deleteExpired = function (callback) {
  var sql = 'delete from paste where ' + Paste.where({expired: true});
  store.query(sql, callback);
};

Paste.prototype.getBrushFile = function () {
  if (_.has(brushList, this.language))
    return brushList[this.language][1];
  else
    return 'shBrushPlain.js';
};

Paste.prototype.getLanguageCaption = function () {
  if (_.has(brushList, this.language))
    return brushList[this.language][0];
  else
    return 'plain';
};

Paste.prototype.getContent = function () {
  var crlf = new RegExp('\r\n', 'g');
  var content = this.content.replace(crlf, '\n');

  return content;
};

Paste.prototype.getExcerpt = function () {
  var content = this.getContent().split('\n'), post = '';

  if (content.length > config.index.max_lines)
    post = '\n...';

  content = content.slice(0, config.index.max_lines);

  return content.join('\n') + post;
};

Paste.prototype.getShortExcerpt = function () {
  var content = this.getContent();

  if (content.length > 80)
    content = content.substr(0, 80) + '...';

  return content;
};

Paste.prototype.announce = function () {
  var url = config.server.url + '/' + this.id;
  var message = 'new paste submitted :: ' + url;
  if (this.summary != '') {
    message += ' :: ' + this.summary;
  }
  announce(message);
};

Paste.prototype.getUrl = function () {
  return config.server.url + '/' + this.id;
};

Paste.prototype.getStatusString = function () {
  switch (this.status) {
  case Paste.STATUS_UNCHECKED: return 'unchecked';
  case Paste.STATUS_APPROVED: return 'approved';
  case Paste.STATUS_SPAM: return 'spam';
  }
  return '?';
};




