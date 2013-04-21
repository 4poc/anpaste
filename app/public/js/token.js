if (typeof require !== 'undefined') {
  var _ = require('underscore');
}

/**
 * Shared utility method to generate random tokens.
 */
var token = {
  CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  generate: function (len) {
      var token = '';
      for (var i = 0; i < len; i++) {
        token += this.CHARS[Math.floor(Math.random() * this.CHARS.length)];
      }
      return token;
  }
};

if (typeof module !== 'undefined')
  module.exports = token;

