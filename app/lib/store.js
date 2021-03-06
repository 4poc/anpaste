
var _ = require('underscore');
var sprintf = require('sprintf').sprintf;
var sqlite3 = require('sqlite3');
var logger = require('./log.js');

var util = require('util');

var config = require('./config.js');

// very simple persistence layer with some very strange query building

// static module-wide database object
var db = new sqlite3.Database(config.database);

// initialize database:
// check if the tables are there, if not initialize
var sql = "select name from sqlite_master where type='table' and name='paste'";
db.get(sql, function (err, row) {
  if (err) {
    console.log('error checking present table paste: ' + err);
    process.exit();
  }

  if (!row) {
    db.serialize(function () {
      logger.info('[init] create table: paste');
      db.run('CREATE TABLE paste (' +
             '    id           TEXT PRIMARY KEY,' +
             '    secret       TEXT,' +
             '    username     TEXT,' +

             '    summary      TEXT,' +
             '    content      TEXT,' +

             '    expire       LONG,' +
             '    created      LONG,' +

             '    encrypted    INTEGER,' +
             '    language     TEXT,' +
             '    private      INTEGER,' +
             '    status       INTEGER DEFAULT 0' +
             ');');

      logger.info('[init] create table: session');
      db.run('CREATE TABLE session (' +
             '    id           TEXT PRIMARY KEY,' +
             '    expired      TEXT,' +
             '    data         TEXT' +
             ');');

      logger.info('[init] create table: user');
      db.run('CREATE TABLE user (' +
             '    username            TEXT PRIMARY KEY,' +
             '    password            TEXT,' +
             '    salt                TEXT,' +

             '    default_language    TEXT,' +
             '    default_expire      INTEGER,' +
             '    default_encryption  INTEGER,' +
             '    default_private     INTEGER,' +
             '    default_announce    INTEGER,' +
             '    default_markdown    INTEGER' +
             ');');

      db.run('PRAGMA user_version=1;');
    });
  }
});

// migrations
var pragma_version = function (version, callback) {
  var next = function (err, row) {
    if (err) return callback(err);
    var version = (row != null && row.user_version) ? row.user_version : 0;
    callback(null, version);
  };
  if (_.isFunction(version)) {
    callback = version;
    logger.trace('query user_version');
    db.get('pragma user_version', next);
  }
  else {
    logger.trace('set user_version %d', version);
    db.get('pragma user_version=' + version, function (err) {
      if (err) return callback(err);
      callback(null, version);
    });
  }
};
var migration = function (err, version) {
  if (err) {
    console.log('error checking version: ' + err);
    process.exit();
  }
  logger.debug('migration version check: %d', version);

  /**
   * 0 -> 1
   * * added status field to paste
   */
  if (version == 0) {
    db.run('alter table paste add column status INTEGER DEFAULT 0', function () {});
    pragma_version(1, migration);
  }

};
pragma_version(migration);

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
exports.connect = connect;

var disconnect = function (callback) {
  if (db) {
    db.close();
  }
};
exports.disconnect = disconnect;

var query = function (query, values, callback) {
  callback = (typeof values == 'function') ? values : callback;
  //logger.trace('execute query: ' + query + ', ' + util.inspect(values));
  db.all(query, values, function (err, res) {
    if (err) return callback("SQL: " + query + "\n" + err);
    callback(null, res);
  });
};
exports.query = query;

var run = function (query, values, callback) {
  callback = (typeof values == 'function') ? values : callback;
  //logger.trace('execute query: ' + query + ', ' + util.inspect(values));
  db.run(query, values, callback);
};
exports.run = run;

/**
 * Count records of the specified table, with an optional where sql.
 *
 * calls callback(err, count)
 */
var count = function (table, where, params, callback) {
  var sql = 'select count(*) as num from ' + table;

  if (_.isFunction(where)) {
    callback = where;
    params = [];
  }
  else if (_.isFunction(params)) {
    callback = params;
    params = [];
    sql += ' where ' + where;
  }
  else {
    sql += ' where ' + where;
  }
  query(sql, params, function (err, res) {
    if (err != null) return callback(err);
    callback(null, res[0].num);
  });
};
exports.count = count;

var insert = function (table, map, callback) {
  var keys = [], values = [];

  for (var k in map) {
    keys.push(k);
    // auto-convert javascript Date() objects into long integer timestamps
    map[k] = _.isDate(map[k]) ? map[k].getTime() : map[k];
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
exports.insert = insert;

var update = function (table, set, where, callback) {
  var num = 1, values = [], setlist = [], wherelist = [];

  for (var key in set) {
    setlist.push(key + ' = ?'); // $' + num);
    set[key] = _.isDate(set[key]) ? set[key].getTime() : set[key];
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
exports.update = update;


