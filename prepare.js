module.exports = function PublishPreview(settings){

        var fs = require('fs'),
	    path = require('path'),
	    rooms = [], 
	    contexts = [],
	    htmls = {},
	    publish = settings.publish || defaultPublish,
	    save = settings.save || defaultSave,
            _ = require('underscore'),
	    createContext = require('./context');

        var module = {};

	function getBasename(path) {
	  var views_dir = settings.view_dir || 'views';
	  var path_reg = new RegExp('^.*/' + views_dir + '/(.*)$');
	  var match = path.match(path_reg);
	  console.log('match: ' + match[1]);
	  return 'index.html';
	}

	function renderString(name) {
		return require('nunjucks').renderString;
	}

	function render(filepath, ops, fn) {
	  var basename = getBasename(filepath),
	      globals = {},
	      template = settings['templates'][basename],
	      renderFn = renderString(basename);

 	 if(_.contains(rooms,basename)) {
	    rooms.push(basename);
	  }
	 
	 initTemplate(basename);
	 /* if(template) {
		globals.template = _.each(template, function(type,field, t) {
		  t[field] = '';
		});
	  }*/

	//  var extract = require('./extract');
	  fs.readFile(filepath, {encoding:'utf8'},function(error,data){
	   if(error) {
	    console.error(error);
	    return;
	   }   

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
	     //var script = '<script>console.log(1)</script>';
	     var script = fs.readFileSync(__dirname + '/script.html', {encoding:'utf8'});     
		
	     return renderFn(script, { name:basename });     
	   }
	   
	   /*function insertClass(match, p1, p2, p3, p4, offset, string){
	     var index = p1.indexOf('class="');
	     var addition = 'data-gnp-value="' + 
			     escape(p2) + 
                             '" data-gnp-key=' + 
                             p4.trim() + 
                             ' class="gnp-watch' 
	     if(index === -1) {
	       return p1.substring(0, p1.length - 1) + ' ' + addition + '">' + p2;
	     }
	    
	     return p1.replace(/class="/, function(match, p5, offset, string) {
	       return  addition + ' ';
	     }) + p2 + p3;
	   }

	   function injectInBody(match, p1, offset, string) {
	     return renderScripts() + 
		    p1; 
	   }*/

           

	   function renderOverlayTemplate() {

	    var overlay = fs.readFileSync(__dirname + '/overlay.html', {encoding: 'utf8'});
	    
	    var keys = Object.keys(template.fields);
	    var fields = [];
	    for(var i = 0; i < keys.length; i++) {
	     var field = {};
	     field['legend'] = keys[i];
	     field['type'] = template.fields[keys[i]];
	     fields.push(field);
	    }    

	    var renderContext = {};
	    renderContext.fields = fields;
	    renderContext.opentag = '{{';
	    renderContext.closetag = '}}';

	    return renderFn(overlay,renderContext);
	   }

	   function renderStyle() {
	    var css = fs.readFileSync(__dirname + '/style.css', {encoding:'utf8'});
	    return '<style>' + css + '</style>';
	   }
	//   var headText = data.substring(0,data.indexOf("<body>"));
	 //  var bodyText = data.substring(data.indexOf("<body>"));
	//   var regExp = new RegExp("(\{\{([^\}]*)\}\})", "g");
//	   var regExp = new RegExp("(<[^<>]*>)([^<>]*(\{\{([^\}]*)\}\}))", "g");
//	   var text = data.replace(regExp, insertClass);
	   //console.log(text);
	   var anything = '([\\s\\S]*)';
	   var tag = new String('(<tag(?:\\s[^>]*?|\\s)*>)any(<\\/tag>)').replace('any', anything);

	   //var bodyOpen = new RegExp("(<body(?:\s[^>]*?|\s)*>)", "g");
	   //var bodyReg = new RegExp("(<body(?:\\s[^>]*?|\\s)*>)([\\s\\S]*)(<\\/body>)", "g");
	   var regexText = tag.replace(/tag/g, 'head') + anything + tag.replace(/tag/g, 'body');	   
//	   data = data.replace(bodyReg, wrapBody);
//	   var endTag = new RegExp("(<\\/body>)", "g");
//	   var wrapperExp = new RegExp("<div class=\"gnp-wrapper\">","g");
//	   console.log(bodyReg.test(data));
//           console.log(wrapperExp.test(data));
//	   var headTag = new RegExp("(<\\/head>)", "g");
//	   var text = data.replace(endTag, injectInBody);
	//   text = text.replace(endTag, injectScript);
//	   text = text.replace(headTag, injectStyle);
	   
	   text = data.replace(new RegExp(regexText),rigMarkup); 

//	   htmls[basename] = text;
	   renderFn(text, contexts[basename].get(0), fn);

	  });
	}

	function setSockets(socket_io) {
	  io = socket_io;
	  rooms = _.uniq(rooms);
	  _.each(rooms, function(room_name, index, list) {
		initSocket(room_name);	
	  });
        }

	function initSocket(name) {
	 //console.log(name);
	 io.on('connection', function(socket) {
	    socket.join(getRoom(name));
	    socket.on('update context', function(context_id,key, value) {
	      contexts[name].update(context_id, key, value);
	      renderContext(name, context_id);
	    });
            socket.on('switch context', function(context_id) {
              console.log('switching context to ' + context_id);
	      renderContext(name, context_id);
            });
	    socket.on('publish context', function(context_id) {
		publish(contexts[name].get(context_id));
	    });
	    socket.on('save context', function(context_id) {
		save(contexts[name].get(context_id));
	    });
	 })
	}

	function renderContext(name, context_id) {
	     var renderFn = renderString(name);
	     var wrapperHTML = renderFn(htmls[name].wrapper, contexts[name].get(context_id));
	     var headHTML = renderFn(htmls[name].head, contexts[name].get(context_id));
	     io.to(getRoom(name)).emit('change dom', context_id, wrapperHTML, '#gnp-wrap'); 
	     io.to(getRoom(name)).emit('change dom', context_id, headHTML, 'head'); 
	}

	function defaultPublish(json) {
		console.log(json);
	}
	
	function defaultSave(json) {
		console.log(json)
	}

	function getRoom(name) {
		var regex = /[^a-zA-Z0-9]/g;
		return name.replace(regex, function() {
			return '';	
		});
	}

	function initTemplate(name) {
	 
	  var context_template = {};
	  _.each(settings.templates[name].fields, function(elem, key) {
	     context_template[key] = '';
	  });

	  if(!contexts[name]) {
	    contexts[name] = createContext(context_template); 
	  }
	
  	  console.log(contexts);

	  if(io) {
	    initSocket(name);
	  }
       }	

	function getSettingsFor(name) {
	  var options = settings.templates[name] || {};
	  options = _.extend(options, global);
	  return options;
	}

	module.nunjucks = render;
	module.listen = setSockets;

	return module;
}
