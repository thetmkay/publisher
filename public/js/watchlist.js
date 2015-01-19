module.exports = function createWatchList() {

	var module = {};	
	var _ = require('underscore');	
	var watchlist = [];
	
	function add(file, key, callback) {
	 remove(key); 
	 var watchlist_obj = _.findWhere(watchlist, { file: file });
         var watch_obj = {
			key: key,
			callback: callback
	 };

         if(!watchlist_obj) {
		watchlist.push({
		 file: file,
		 stamp: file.lastModifiedDate,
		 list: [ watch_obj ]
		});
	 } else {
		var list = watchlist_obj.list;
		if(! _.findWhere(list, { key: key })) {
		  list.push(watch_obj);
		}
	 }          

	
	}

	function remove(key){
		watchlist = _.reject(watchlist, function(elem) {
			elem.list = _.reject(elem.list, function(obj){
				return obj.key === key;	
			});
			return elem.list.length < 1;
		});
	}
	
	function poll() {
		_.each(watchlist, function(element, index, list) {
			if(element.file.lastModifiedDate > element.stamp){
			   _.each(element.list, function(elem, i, l){
				console.log('updating for ' + elem.key);
			   	elem.callback();
			   });
			}
		});
	}
	
	module.poll = poll;
	module.add = add;
	module.remove = remove;	
	return module;
}


