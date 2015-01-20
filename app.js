/**
 * Module dependencies
 */

  var express = require('express'),
    app = express(),
    http = require('http'),
    path = require('path'),
    cons = require('consolidate'),
    //server = app.listen(app.get('port')),
    //io = require('socket.io')(server),
    pp_config = require('./pp_config'),
    pp = require('./prepare')(pp_config),
    db = require('./db')(user, password);

  /**
   * Configuration
   */
  // all environments
  app.set('port', process.env.PORT || 3000);
  app.engine('html', pp.nunjucks);
  //app.watch = pp.watch;
  app.set('view engine', 'html');
  app.use(express.static(path.join(__dirname, 'public')));
  // app.use(app.router);

 // app.use('/preview', pp.initMiddleware);
  app.use('/publish', require('./publish')(db.savePost, db.savePost));

  app.get('/:name', function(req,res) {
    console.log('rendering ' + req.params.name);
    res.render(req.params.name);
  })

  app.get('/', function(req,res) {
    res.render('index');
  });

  //module.exports = app;

  var server = app.listen(app.get('port'));
  var io = require('socket.io')(server);
//  pp.watch(io);
