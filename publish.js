module.exports = function(localSaveFn, remoteSaveFn){
	
	var router = require('express').Router();

	router.get('/local', function(req, res, next) {
		console.log(req);
		var post = {};
		localSaveFn(post,res.send.bind(res,'success'));
		//res.send('success');
	});

	router.post('/remote', function(req, res, next) {
		var post = {};
		console.log(req);
		remoteSaveFn(post,res.send.bind(res, 'success'));
	});

	/*router.use('*', function(req,res,next) {
		res.send('router');
	});*/

	return router;

}
