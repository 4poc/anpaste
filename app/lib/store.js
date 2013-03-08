
var sprintf = require('sprintf').sprintf;
var pg = require('pg').native;

var util = require('util');

var config = require('../../config.json');

// very simple persistence layer with some very strange query building

var url = sprintf('postgres://%s:%s@%s:%d/%s',
  config.database.username,
  config.database.password,
  config.database.host,
  config.database.port,
  config.database.database
);

var token = {
  CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  gen: function (length, fixed_length) {
    var string = '';
    for (var i = 0; i < length; i++) {
      string += this.CHARS[Math.floor(Math.random() 
        * this.CHARS.length)];
    }
    return string;
  }
};

var connect = function (callback) {
  //console.log('connect : ' + url);
  pg.connect(url, function (err, db) {
    if (err) {
      console.log('ERROR: ' + err);
      return;
    }
    callback(db);
  });
};

var disconnect = function (callback) {
  pg.end();
};

var query = function (query, values, callback) {
  callback = (typeof values == 'function') ? values : callback;
  console.log('execute query: ' + query + ', ' + util.inspect(values));
  connect(function (db) {
    db.query(query, values, callback);
  });
};

// count paste entries with an optional id
var count = function (table, id, callback) {
  callback = (typeof id == 'function') ? id : callback;
  connect(function (db) {
    var where = '', val = [];
    if (typeof id == 'string') {
      where = ' where id = $1';
      val = [ id ];
    }
    db.query('select count(*) as num from ' + table + where, val, 
      function (err, res) {
        if (err != null) return callback(err);
        callback(null, res.rows[0].num);
    });
  });
};

var insert = function (table, map, callback) {
  var keys = [], values = [];
  for (var k in map) {
    keys.push(k);
    values.push(map[k]);
  }
  /* _map = func.domagick(map)
   * keys = _map.keys, values = _map.values
   * better?
   */

  var names = keys.join(', ')
    , placeholder = (function (count) {
        var v = [];
        for (var i = 1; i <= count; i++) {
          v.push('$' + i);
        }
        return v;
      }(values.length)).join(', ');

  query(sprintf('insert into %s (%s) values (%s)', 
    table, names, placeholder), values, callback);
};

var update = function (table, set, where, callback) {
  var num = 1, values = [], setlist = [], wherelist = [];

  for (var key in set) {
    setlist.push(key + ' = $' + num);
    values.push(set[key]);
    num++;
  }

  for (var key in where) {
    wherelist.push(key + ' = $' + num);
    values.push(where[key]);
    num++;
  }

  query(sprintf('update %s set %s where %s', table, setlist.join(', '),
    wherelist.join(' and ')), values, callback);
};

var makeid = function (min_length, callback) {
  var genid = function (count) {
    var len = Math.ceil(Math.log(count + 1) /
      Math.log(token.CHARS.length)), id;
    return token.gen(len); 
  }, id;
  count('paste', function (err, all) {
    if (err != null) return callback(err);
    var next = function () {
      id = genid(all);
      console.log("id.length(" + id.length + ") < " + min_length)
      if (id.length < min_length) {
        id = token.gen(min_length);
      }
      count('paste', id, function (err, num) {
        if (err != null) return callback(err);
        if (num == 0) return callback(null, id);
        next();
      });
    };
    next();
  });
};

exports.connect = function (callback) {
  return connect(callback);
};
exports.get = function (id, callback) {
  query('select * from paste where id = $1', [id], function (err, res) {
    if (err != null) return callback(err);
    if (res.rows.length == 0) return callback(new Error('paste not found'));
    if (res.rows[0].expire != null && new Date() > res.rows[0].expire)
      return callback(new Error('paste expired'));
    callback(null, res.rows[0]);
  });
};
exports.create = function (paste, callback) {
  makeid(paste.private ? 16 : 1, function (err, id) {
    if (err != null) return callback(err);
    paste.id = id;
    paste.secret = token.gen(16, paste.private ? true : false);
    paste.created = new Date();
    insert('paste', paste, function (err, res) {
      if (err != null) return callback(err);
      callback(null, paste);
    });
  });
};
exports.update = function (paste, callback) {
  update('paste', paste, {id: paste.id, secret: paste.secret}, callback);
};
exports.delete = function (id, callback) {
  query('delete from paste where id = $1', [id], callback);
};
exports.deleteExpired = function (callback) {
  query('delete from paste where expire is not null and now() > expire',
    callback);
};
exports.disconnect = disconnect;

