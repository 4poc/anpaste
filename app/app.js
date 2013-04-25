
// Module dependencies
var express = require('express');
var strftime = require('strftime');
var _ = require('underscore');

var path = require('path');
var http = require('http');
var util = require('util');

// Internal modules
var routes = require('./routes');
var api = require('./routes/api');
var middlewares = require('./middlewares.js');
var store = require('./lib/store.js');
var tcpsrv = require('./lib/tcpsrv.js');

var ConnectStore = require('./lib/connect-store.js')(express);

var Paste = require('./models/paste.js').Paste;

// Initialisation of express
var app = express();

// Configuration
var public_path = path.join(__dirname, './public');
var config = require('../config.json');
var brush = require('../brush.json');
var logger = require('./lib/log.js');

app.configure(function () {
  app.enable('trust proxy');

  // Setup view tempates
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.locals.pretty = true;

  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(express.cookieParser());
  app.use(express.session({
    store: new ConnectStore,
    secret: config.session.secret,
    cookie: { maxAge: config.session.maxAge }
  }));

  app.use(express.static(public_path));
  //app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  // compile the less stylesheet to a css
  app.use(require('less-middleware')({ src: public_path }));

  // setup locals / view/request helpers
  app.use(function (req, res, next) {
    res.locals.domain = req.headers.host;
    res.locals.url = function (args, hash) {
      var url = req.protocol + '://' + req.headers.host + '/' + args.join('/');
      if (typeof hash != 'undefined' && hash != null && hash != '') {
        url += '#' + hash;
      }
      if (url.charAt(0) != '/' && url.indexOf('http') !== 0)
        url = '/' + url;
      return url;
    };

    res.locals.config = config;
    res.locals.brush = brush;
    res.locals.strftime = strftime;
    res.locals.session = req.session;

    // set session default values:
    _.defaults(req.session, config.session.defaults);

    next();
  });

  app.use(middlewares.requestLogger);
});


// sets a timer to delete expired pastes every 15 minutes
setInterval(function () {
  Paste.deleteExpired(function (err) {
    if (err) {
      logger.error('delete expired pastes failed!');
      logger.error(err);
    }
    logger.trace('deleted expired pastes');
  });
}, 15 * 60 * 1000);


// setup routes
app.get ('/'                   , routes.index);
app.get ('/list'               , routes.list);
app.get ('/create'             , routes.createPasteForm);
app.post('/create'             , routes.createPaste);
app.get ('/update/:id/:secret' , routes.updatePasteForm);
app.post('/update'             , routes.updatePaste);
app.get ('/delete/:id/:secret' , routes.deletePasteForm);
app.post('/delete'             , routes.deletePaste);
app.post('/settings'           , routes.settings);
app.get ('/about'              , routes.about);

// setup REST API routes
app.get ('/api/1/paste'        , api.list);
app.get ('/api/1/paste/:id'    , api.readPaste);
app.post('/api/1/paste'        , api.createPaste);
app.put ('/api/1/paste/:id'    , api.updatePaste);
app.delete('/api/1/paste/:id'  , api.deletePaste);

app.get ('/:id.:format?/:file?', routes.readPaste);
app.all ('*'                   , routes.notFound);

// Error messages display the create form with a notice
app.use(function (err, req, res, next) {
  logger.error('error in routing occured:');
  logger.error(err);
    res.status(500);
  if (req.path.match(/^\/api/i)) {
    res.json({error: err.toString()});
  }
  else if (req.path.match(/^\/create/i)) {
    res.render('create', {notice: err});
  }
  else {
    if (err.toString().match('paste not found'))
      return routes.notFound(req, res, next);
    res.render('error', {error: err.toString()});
  }
});


// start the express server
http.createServer(app).listen(config.server.port, config.server.bind, function() {
  logger.info('express webserver listening: %s:%d', config.server.bind, config.server.port);
});

// start the TCP server, for netcat/telnet posting;)
tcpsrv.create();


