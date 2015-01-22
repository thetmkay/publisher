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
    pp = require('./preview'), 
    db = require('./db')('', ''),
    server = http.createServer(app),
    io = require('socket.io')(server);
 
/**
   * Configuration
   */
  // all environments
  app.set('port', process.env.PORT || 3000);
  app.engine('html', cons.nunjucks);
  //app.watch = pp.watch;
  app.set('view engine', 'html');
  app.use(express.static(path.join(__dirname, 'public')));
  // app.use(app.router);

 var pp_config = require('./pp_config');
 pp_config.publish = db.publishPost;
 pp_config.save = db.savePost;

 app.use('/preview', pp(app, io, pp_config));

  app.get('/:name', function(req,res) {
    console.log('rendering ' + req.params.name);
//    res.render(req.params.name);
	res.send('hello');
  })

  app.get('/', function(req,res) {
    res.render('index');
  });

  //module.exports = app;

    server.listen(app.get('port'), function() {
	console.log('Server is listening on port ' + (app.get('port') || 3000));
  });

