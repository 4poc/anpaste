/*!
 * This is based of connect-sqlite, original legal statement:
 * Connect - SQLite
 * Copyright(c) 2011 tnantoka <bornneet@livedoor.com>
 * MIT Licensed
 * forked from https://github.com/visionmedia/connect-redis 
 */

var store = require('./store.js');
var events = require('events');
var logger = require('./log.js');

module.exports = function (connect) {
  var Store = connect.session.Store;

  function ConnectStore(options) {
    options = options || {};
    Store.call(this, options);

    this.client = new events.EventEmitter();
    var self = this;
    self.client.emit('connect');
  }
  ConnectStore.prototype.__proto__ = Store.prototype;
  ConnectStore.prototype.get = function(id, fn){
    var now = new Date().getTime();
    store.query('select data from session where id = ? and ? <= expired', [id, now], function (err, rows) {
        if (err) fn(err);
        if (!rows || rows.length === 0) {
          return fn();
        }
        fn(null, JSON.parse(rows[0].data));
    });
  };
  ConnectStore.prototype.set = function(id, data, fn) {
    try {
      var maxAge = data.cookie.maxAge;
      var now = new Date().getTime();
      var expired = maxAge ? now + maxAge : now + oneDay;
      data = JSON.stringify(data);
      store.run('INSERT OR REPLACE INTO session values (?, ?, ?)',
        [id, expired, data],
        function(err) {
          if (fn) fn.apply(this, arguments);
        }
      );
    } catch (e) {
      console.log(e);
      if (fn) fn(e);
    }
  };
  ConnectStore.prototype.destroy = function(id, fn){
    store.run('DELETE FROM session WHERE id = ?;', [id], fn);
  };
  ConnectStore.prototype.length = function(fn){
    store.count('session', function (err, num) {
      if (err) fn(err);
      fn(null, num);
    });
  };
  ConnectStore.prototype.clear = function(fn){
    store.run('delete from session', function(err) {
      if (err) fn(err);
      fn(null, true);
    });
  };

  return ConnectStore;
};
