module.exports = function(user, password) {

  var module = {};
 
  var dbUrl = 'mongodb://' + user + ':' + password + '@kahana.mongohq.com:10075/humblr';

  var db = require('mongoskin').db(dbUrl, { w: 1 });

  function savePost(post, fn) {

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

  module.savePost = savePost;

  return module;

}
