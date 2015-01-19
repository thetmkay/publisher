/**
 * Module dependencies
 */

var app = require('./app');


/**
 * Start Server
 */

var server = app.listen(app.get('port'));
var io = require('socket.io')(server);
app.watch(io);
