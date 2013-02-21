
// Module dependencies
var express = require('express');

var path = require('path');
var http = require('http');

// Internal modules
var routes = require('./routes');
var mid = require('./middlewares.js');

// Initialisation of express
var app = express();


// Configuration
var public_path = path.join(__dirname, './public');
var config = require('../config.json');


app.configure(function () {
  // Setup view tempates
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(express.static(public_path));
  // compile the less stylesheet to a css
  app.use(require('less-middleware')({ src: public_path }));
  
  // show awesome error messages
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));


  // setup locals / view/request helpers
  app.use(function (req, res, next) {
    res.locals.url = function (args, hash) {
      var url = req.protocol + '://' + req.headers.host + '/' + args.join('/');
      if (typeof hash != 'undefined' && hash != null && hash != '') {
        url += '#' + hash;
      }
      if (url.charAt(0) != '/' && url.indexOf('http') !== 0)
        url = '/' + url;
      return url;
    };

    next();
  });
});


// sets a timer to delete expired pastes every 5 minutes
setInterval(function () {
  console.log('delete expired');
  store.deleteExpired(function (err) {
    if (err != null) console.error(err);
  });
}, 5 * 60 * 1000);


// setup routes
app.get ('/'                   , routes.index);
app.get ('/create'             , routes.createPasteForm);
app.post('/create'             , routes.createPaste);
app.get ('/:id.:format?'       , routes.readPaste);
app.get ('/update/:id/:secret' , routes.updatePasteForm);
app.post('/update'             , routes.updatePaste);
app.get ('/delete/:id/:secret' , routes.deletePasteForm);
app.post('/delete'             , routes.deletePaste);


// Error messages all redirect to create
app.use(function (err, req, res, next) {
  res.render('create', {notice: err});
});


// start the express server
http.createServer(app).listen(config.server.port, config.server.bind, function() {
  console.log('Express server listening on port ' + config.server.port);
});


