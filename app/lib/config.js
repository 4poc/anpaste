var fs = require('fs');
var path = require('path');
var YAML = require('libyaml');
var _ = require('underscore');
_.mixin({deepExtend: require('./deep_extend_underscore_mixin.js').deepExtend});

var filename = path.join(__dirname, '../../config.yaml');
var contents = fs.readFileSync(filename);

var config = YAML.parse(contents.toString())[0];

if (!process.env.NODE_ENV)
  process.env.NODE_ENV = 'development';
console.log('read anpaste configuration ' + filename + ' env: ' + process.env.NODE_ENV);

var env_config = config[process.env.NODE_ENV];
config = _.omit(config, ['development', 'test', 'production']);
config = _.deepExtend(config, env_config);

module.exports = config;

