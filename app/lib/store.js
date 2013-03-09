
var sprintf = require('sprintf').sprintf;
var sqlite3 = require('sqlite3');

var util = require('util');

var config = require('../../config.json');

// very simple persistence layer with some very strange query building

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

// static module-wide database object
var db = new sqlite3.Database(config.database);

// initialize database:
db.serialize(function () {
  // check if the tables are there, if not initialize
  var sql = "select name from sqlite_master where type='table' and name='paste'";
  db.get(sql, function (err, row) {
    if (err) {
      console.log('error checking present table paste: ' + err);
      process.exit();
    }

    if (!row) {
      console.log('[init] create table: paste');
      db.run('CREATE TABLE paste (' +
             '    id           TEXT PRIMARY KEY,' +
             '    secret       TEXT,' +
             '    summary      TEXT,' +
             '    content      TEXT,' +

             '    expire       LONG,' +
             '    created      LONG,' +

             '    encrypted    INTEGER,' +
             '    language     TEXT,' +
             '    private      INTEGER' +
             ');');

      console.log('[init] create table: session');
      db.run('CREATE TABLE session (' +
             '    id           TEXT PRIMARY KEY,' +
             '    expired      TEXT,' +
             '    data         TEXT' +
             ');');

    }
  });

});

// open/create sqlite3 database
var connect = function (callback) {
  console.log('connect sqlite3 database file...');
  if (!db) {
    db = new sqlite3.Database(config.database, function (err) {
      if (err) {
        db = null;
        console.log('error opening database: ' + err);
        callback(err);
        return;
      }

      console.log('return newly opened database,');
      
    });
  }
  else {
    console.log('return already open database');
    callback(null, db);
  }
};

var disconnect = function (callback) {
  if (db) {
    db.close();
  }
};

var query = function (query, values, callback) {
  callback = (typeof values == 'function') ? values : callback;
  console.log('execute query: ' + query + ', ' + util.inspect(values));
  db.all(query, values, callback);
};

var run = function (query, values, callback) {
  callback = (typeof values == 'function') ? values : callback;
  console.log('run query: ' + query + ', ' + util.inspect(values));
  db.run(query, values, callback);
};

// count paste entries with an optional id
var count = function (table, id, callback) {
  callback = (typeof id == 'function') ? id : callback;
  var where = '', val = [];
  if (typeof id == 'string') {
    where = ' where id = ?';
    val = [ id ];
  }
  query('select count(*) as num from ' + table + where, val, 
    function (err, res) {
      if (err != null) return callback(err);
      callback(null, res[0].num);
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
          v.push('?');// ('$' + i);
        }
        return v;
      }(values.length)).join(', ');

  query(sprintf('insert into %s (%s) values (%s)', 
    table, names, placeholder), values, callback);
};

var update = function (table, set, where, callback) {
  var num = 1, values = [], setlist = [], wherelist = [];

  for (var key in set) {
    setlist.push(key + ' = ?'); // $' + num);
    values.push(set[key]);
    num++;
  }

  for (var key in where) {
    wherelist.push(key + ' = ?'); // $' + num);
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
exports.query = query;
exports.run = run;
exports.count = count;
exports.get = function (id, callback) {
  query('select * from paste where id = ?', [id], function (err, res) {
    if (err != null) return callback(err);
    if (res.length == 0) return callback(new Error('paste not found'));
    var paste = res[0];

    // convert datetime columns into date objects
    paste.created = new Date(parseInt(paste.created, 10));
    if (paste.expire)
      paste.expire = new Date(parseInt(paste.expire, 10));

    if (paste.expire != null && new Date().getTime() > paste.expire)
      return callback(new Error('paste expired'));

    callback(null, paste);
  });
};
exports.create = function (paste, callback) {
  makeid(paste.private ? 16 : 1, function (err, id) {
    if (err != null) return callback(err);
    paste.id = id;
    paste.secret = token.gen(16, paste.private ? true : false);
    paste.created = new Date().getTime();
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
  query('delete from paste where id = ?', [id], callback);
};
exports.deleteExpired = function (callback) {
  var now = new Date().getTime();
  query("delete from paste where expire is not null and ? > expire", now,
    callback);
};
exports.disconnect = disconnect;

