module.exports = function(user, password) {

  var module = {};

  //imports
  var path = require('path'),
      fs = require('fs'),
      mongo = require('mongoskin');
 
  var dbUrl = 'mongodb://' + user + ':' + password + '@kahana.mongohq.com:10075/humblr';

  var db = mongo.db(dbUrl, { w: 1 });

  function publishPost(key, post, fn) {

	var collection = db.collection('posts');
	//todo: add key support
	var key = {
	//	url: post.url
        };

	var options = {
		safe: true,
		upsert: true
	};
	
	collection.update(key, post, options, function(err, count) {
		if(!err) {
			console.log(count + ' posts updated');
		} else {
			console.error('Error updating post: ' + err);
		}

		fn();
	});
  }

  function savePost(title, post, fn) {
	var filename = path.join(__dirname, 'db', title + '.json');
	fs.writeFile(filename, JSON.stringify(post), {encoding: 'utf8'}, fn);
  }

  module.publishPost = publishPost;
  module.savePost = savePost;

  return module;

}
