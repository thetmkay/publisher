module.exports = function PublishPreview(app,io, settings){


	//imports
        var fs = require('fs'),
	    path = require('path'),
	    //io = require('socket-io'),
            _ = require('underscore'),
	    partialsRenderFn = require('nunjucks').renderString,
	    createContext = require('./js/context');

	var rooms, contexts, htmls, filecontexts;

	var defaults = {
		publish: defaultPublish,
		save: defaultSave,
		views: app.get('views'),
		engines: app.engines || {},
		templates: {},
		defaultExt: app.get('view engine')
	};

	function init() {
	    contexts = {};
	    filecontexts = {};
	    htmls = {};

	    settings = settings || {};	 
	    _.extend(defaults, settings);
	    settings = defaults;
	}

	function renderString(name) {
		var extension = path.extname(name) || settings.defaultExt;
		
		return settings.engines[extension].render || partialsRenderFn;
	}

	function render(filepath, ops, fn) {

	  if(path.extname(filepath) === '') {
		filepath += '.' + settings.defaultExt;
		console.log('appended extension: ' + filepath);
	  }

	  var basename = path.relative(settings.views, filepath),
	      globals = {},
	      template = settings['templates'][basename] || {},
	      renderFn = renderString(basename);

	 initTemplate(basename);
	 
	  fs.readFile(filepath, {encoding:'utf8'},function(error,data){
	   if(error) {
	    console.error(error);
	    return fn('Cannot get ' + basename);
	   }   

	   var anything = '([\\s\\S]*)';
	   var tag = new String('(<tag(?:\\s[^>]*?|\\s)*>)any(<\\/tag>)').replace('any', anything);
	   var regexText = tag.replace(/tag/g, 'head') + anything + tag.replace(/tag/g, 'body');	   
	   text = data.replace(new RegExp(regexText),rigMarkup); 


	   renderFn(text, getContext(basename, 0), fn);
	});	

	   function rigMarkup(match, p0, p1, p2, p3, p4, p5, p6, offset, string) {
		var head = p0 + p1 + renderStyle() + p2;
		var wrapper = '<div id="gnp-wrap">' + renderOverlayTemplate() + p5 + '</div>';

		htmls[basename] = {
			 wrapper: wrapper,
			 head: head
		}

		return head + p3 + p4 + wrapper + renderScripts() + p6;
	   }

	   function renderScripts() {
	     var script = fs.readFileSync(__dirname + '/views/script.html', {encoding:'utf8'});     
	     return partialsRenderFn(script, {});     
	   }

	   function renderOverlayTemplate() {

	    var overlay = fs.readFileSync(__dirname + '/views/overlay.html', {encoding: 'utf8'});
	    
	    var fields = [];
	    if(template.fields) {
		    var keys = Object.keys(template.fields);
		    for(var i = 0; i < keys.length; i++) {
		     var field = {};
		     field['legend'] = keys[i];
		     field['type'] = template.fields[keys[i]];
		     fields.push(field);
		    }    
	    }

	    var renderContext = {};
	    renderContext.fields = fields;
	    renderContext.opentag = '{{';
	    renderContext.closetag = '}}';

	    return partialsRenderFn(overlay,renderContext);
	   }

	   function renderStyle() {
	    var css = fs.readFileSync(__dirname + '/css/style.css', {encoding:'utf8'});
	    var fonts = '<link href="http://fonts.googleapis.com/css?family=Inconsolata:400,700" rel="stylesheet" type="text/css">';
	    return fonts + '<style>' + css + '</style>';
	   }	  
	}

	function initSocket(name) {
	 //console.log(name);
	 io.on('connection', function(socket) {
	    socket.join(getRoom(name));
	    socket.on('update context', function(context_id,key, value, filename) {
	      if(filename) {
		filecontexts[name].update(key, filename);
	      }
	      contexts[name].update(context_id, key, value);
	      renderContext(name, context_id);
	    });
            socket.on('switch context', function(context_id) {
           //   console.log('switching context to ' + context_id);
	      renderContext(name, context_id);
            });
	    socket.on('publish context', function(context_id) {
		settings.publish({},contexts[name].get(context_id), function(err) {
		  if (err) throw err;
  		  console.log('Published');
		});
	    });
	    socket.on('save context', function(context_id) {
		var savename = getRoom(name) + '-' + context_id;
		settings.save(savename, contexts[name].get(context_id), function(err) {
			if (err) throw err;
			console.log('Saved in ' + savename);
		});
	    });
	 })
	}

	function renderContext(name, context_id) {
		var renderFn = renderString(name);

		renderFn(htmls[name].wrapper, getContext(name,context_id), function(err,wrapperHTML) {
			io.to(getRoom(name)).emit('change dom', context_id, wrapperHTML, '#gnp-wrap'); 
		});
		renderFn(htmls[name].head, getContext(name,context_id), function(err,headHTML) {
			io.to(getRoom(name)).emit('change dom', context_id, headHTML, 'head'); 
		});
	}

	function getContext(name, context_id) {
		var context = _.clone(contexts[name].get(context_id));
		var files = filecontexts[name].get(context_id);
		
		context['_gnp_files'] = files;
		return context;
	}

	function defaultPublish(key, json, fn) {
		console.log(json);
		fn(false);
	}
	
	function defaultSave(title, json, fn) {
		console.log(json)
		fn(false);
	}

	function getRoom(name) {
		var regex = /[^a-zA-Z0-9]/g;
		return name.replace(regex, function() {
			return '';	
		});
	}

	function initTemplate(name) {
	 
	  var context_template = {};
	  var file_template = {};

	  if(settings.templates[name]) {
	     _.each(settings.templates[name].fields, function(elem, key) {
	        context_template[key] = '';
		if(elem === '.md') {
			file_template[key] = '';
		}
	     });
	  }

	  if(!contexts[name]) {
	    contexts[name] = createContext(context_template); 
	  }
	
	  if(!filecontexts[name]) {
	    filecontexts[name] = createContext(file_template); 
	  }


	  initSocket(name);
       }	

	function getSettingsFor(name) {
	  var options = settings.templates[name] || {};
	  options = _.extend(options, global);
	  return options;
	}

	function middleware(req, res, next) {
		switch(path.extname(req.path)) {
		case '.js':
			res.sendFile(path.join(__dirname,'public', req.path));
			break;
		default:
			var req_path = req.path;
			if(req.path === '/'){
				req_path = '/index';
			}
			var filepath = path.join(settings.views, req_path);
			render(filepath, {}, function(err,html) {
				res.send(html);
			});
		}
	}

	init();

	return middleware;
}
