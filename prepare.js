module.exports = function PublishPreview(options){

        var fs = require('fs'),
            _ = require('underscore');

        var module = {},
            globals;

        function init(options) {
          globals = _.pick(options, ['dropbox_key']);
        }

	function render(path, options, fn) {
	  var fs = require('fs');
	  var nunjucks = require('nunjucks');
	  var _ = require('underscore');
	//  var extract = require('./extract');
	  fs.readFile(path, {encoding:'utf8'},function(error,data){
	   if(error) {
	    console.error(error);
	    return;
	   }   

	   function wrapSpan(match, p1, p2, offset, string) {
	     return '<span class="gnp-watch" data-gnp-key="' + p2.trim() + '">' + p1 + '</span>';
	   }

	   function renderScripts() {
	     //var script = '<script>console.log(1)</script>';

	     var script = fs.readFileSync(__dirname + '/script.html', {encoding:'utf8'});     

	     return nunjucks.renderString(script, globals);     
	   }
	   
	   function insertClass(match, p1, p2, p3, p4, offset, string){
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
	     return renderOverlayTemplate() +
		    renderScripts() + 
		    p1; 
	   }

           

	   function renderOverlayTemplate() {

	    var template = fs.readFileSync(__dirname + '/overlay.html', {encoding: 'utf8'});
	    
	    var json = require('./index.json');
	    
	    var keys = Object.keys(json);
	    var fields = [];
	    for(var i = 0; i < keys.length; i++) {
	     var field = {};
	     field['legend'] = keys[i];
	     field['type'] = json[keys[i]];
	     fields.push(field);
	    }    

	    return nunjucks.renderString(template,{fields:fields});
	   }

	   function injectStyle(match, p1, offset, string) {
	    var css = fs.readFileSync(__dirname + '/style.css', {encoding:'utf8'});
	    return '<style>' + css + '</style>' + p1;
	   }
	//   var headText = data.substring(0,data.indexOf("<body>"));
	 //  var bodyText = data.substring(data.indexOf("<body>"));
	//   var regExp = new RegExp("(\{\{([^\}]*)\}\})", "g");
	   var regExp = new RegExp("(<[^<>]*>)([^<>]*(\{\{([^\}]*)\}\}))", "g");
	   var text = data.replace(regExp, insertClass);
	   console.log(text);
	   var endTag = new RegExp("(<\/body>)", "g");
	   var headTag = new RegExp("(<\/head>)", "g");
	   text = text.replace(endTag, injectInBody);
	//   text = text.replace(endTag, injectScript);
	   text = text.replace(headTag, injectStyle);
	   nunjucks.renderString(text, options, fn);

	  });
	}

	module.nunjucks = render;
	init(options);

	return module;
}
