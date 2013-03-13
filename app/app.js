
// Module dependencies
var express = require('express');
var strftime = require('strftime');
var _ = require('underscore');

var path = require('path');
var http = require('http');
var util = require('util');

// Internal modules
var routes = require('./routes');
var mid = require('./middlewares.js');
var store = require('./lib/store.js');
var tcpsrv = require('./lib/tcpsrv.js');

var ConnectStore = require('./lib/connect-store.js')(express);

// Initialisation of express
var app = express();


// Configuration
var public_path = path.join(__dirname, './public');
var config = require('../config.json');
var brush = require('../brush.json');


app.configure(function () {
  // Setup view tempates
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.locals.pretty = true;

  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(express.cookieParser());
  app.use(express.session({
    store: new ConnectStore,
    secret: config.session.secret,
    cookie: { maxAge: config.session.maxAge }
  }));

  app.use(express.static(public_path));
  // compile the less stylesheet to a css
  app.use(require('less-middleware')({ src: public_path }));
  
  // show awesome error messages
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));


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
});


// sets a timer to delete expired pastes every 5 minutes
setInterval(function () {
  console.log('delete expired pastes');
  store.deleteExpired(function (err) {
    if (err != null) console.error(err);
  });
}, 15 * 60 * 1000);


// setup routes
app.get ('/'                   , routes.index);
app.get ('/list'               , routes.list);
app.get ('/create'             , routes.createPasteForm);
app.post('/create'             , routes.createPaste);
app.get ('/:id.:format?/:file?', routes.readPaste);
app.get ('/update/:id/:secret' , routes.updatePasteForm);
app.post('/update'             , routes.updatePaste);
app.get ('/delete/:id/:secret' , routes.deletePasteForm);
app.post('/delete'             , routes.deletePaste);
app.post('/settings'           , routes.settings);
app.get ('/about'              , routes.about);
app.get ('*'                   , routes.notFound);


// Error messages all redirect to create
app.use(function (err, req, res, next) {
  console.log('\n');
  console.log('AN ERROR OCCURED :: ' + req.ip + ' :: ' + req.originalUrl);
  console.log(' ========================================================= ');
  console.log(err);
  console.log('\n');
  res.render('create', {notice: err});
});


// start the express server
http.createServer(app).listen(config.server.port, config.server.bind, function() {
  console.log('Express server listening on port ' + config.server.port);
});

// start the TCP server, for netcat/telnet posting;)
tcpsrv.create();


