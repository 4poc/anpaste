var _ = require('underscore');
var store = require('../lib/store.js');
var token = require('../public/js/token.js');
var config = require('../../config.json');
var brush = require('../../brush.json');
var announce = require('../lib/announce.js').announce;

var brushList = {};
_.each(brush, function (b) {
  brushList[b[1]] = [b[2], b[0]];
});

function Paste(obj) {
  this.id = obj.id || null;

  if (_.isNull(this.id))
    this.secret = token.generate(16);
  else
    this.secret = obj.secret || null;

  this.username = obj.username || null;
  this.summary = obj.summary || null;

  this.stream = obj.stream;
  if (!this.stream) {
    if (_.isEmpty(obj.content))
      throw new Error('content is required');
    if (!_.isString(obj.content))
      throw new Error('content must be string');
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
  if (!_.has(brushList, obj.language))
    throw new Error('invalid language');
  if (_.isString(this.language))
    this.language = obj.language;


  this.encrypted = obj.encrypted === 'true';
  this.private = obj.private === 'true';
}
exports.Paste = Paste;

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

  return where.join(' and ');
};

Paste.page = function (page, callback) {
  Paste.countAllPublic(function (err, all) {
    if (err != null) return next(err);
    var page_count = Math.ceil(all / config.index.per_page);
    var start = (page-1) * config.index.per_page;
    Paste.list(start, config.index.per_page, {encrypted: false, private: false}, 
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
  callback = _.isFunction(id) ? id : callback;
  var self = this;

  // this is done async: read the stream for the content
  if (this.stream) {
    this.content = '';
    this.stream.on('data', function (data) {
      self.content += data;
    });
    this.stream.on('close', function () {
      if (self.content.length > 0) {
        next();
      }
      else {
        callback('paste upload failed.');
      }
    });
  }
  else {
    next();
  }

  function next() {
    console.log('next: ' + self.id);
    if (self.id) // update existing record
      self._update(callback);
    else { // insert new
      if (_.isNumber(id)) { // use the provided id
        self.id = id;
        self._insert(callback);
      }
      else { // use a randomly generated new one
        Paste.claimId(self.private ? 16 : 1, function (err, id) {
          if (err) return callback(err);
          self.id = id;
          self._insert(callback);
        }.bind(self));
      }
    }
  }
};

Paste.prototype._insert = function (callback) {
  var obj = _.pick(this, ['id', 'secret', 'username', 'summary', 'content',
      'expire', 'created', 'encrypted', 'language', 'private']);
  store.insert('paste', obj, callback);
};

/**
 * Updates an existing paste.
 * 
 * Only allows to edit summary, content and language.
 */
Paste.prototype._update = function (callback) {
  store.update('paste', _.pick(this, ['summary', 'content', 'language']), 
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
  var content = this.content.replace('\r\n', '\n');

  return content;
};

Paste.prototype.getExcerpt = function () {
  var content = this.getContent().split('\n'), post = '';

  if (content.length > config.index.max_lines)
    post = '\n...';

  content = content.slice(0, config.index.max_lines);

  return content.join('\n') + post;
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




