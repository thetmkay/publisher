module.exports = function(path, options, fn) {
  var fs = require('fs');
  var nunjucks = require('nunjucks');
  var _ = require('underscore');
  fs.readFile(path, {encoding:'utf8'},function(error,data){
   if(error) {
    console.error(error);
    return;
   }   

   function wrapDiv(match, p1, offset, string) {
     console.log(p1);
     return '<div>' + p1 + '</div>';
   }

   function extract(str) {
    var reg = new RegExp("\{\{([^\}]*)\}\}", "g");
    var match = reg.exec(str);
    var matches = [];
    while(match){
     matches.push(match[1]);
     match = reg.exec(str);
    }
    return _.uniq(matches);
   }

   function injectScript(match, p1, offset, string) {
     //var script = '<script>console.log(1)</script>';

     var script = fs.readFileSync(__dirname + '/script.html', {encoding:'utf8'});     

     return script + p1;     
   }

   function injectTemplate(match, p1, offset, string) {

    var template = fs.readFileSync(__dirname + '/overlay.html', {encoding: 'utf8'});
    
    console.log(string);

    return nunjucks.renderString(template,{fields:[{legend:'title'}]});
   }

   function injectStyle(match, p1, offset, string) {
    var css = fs.readFileSync(__dirname + '/style.css', {encoding:'utf8'});
    return '<style>' + css + '</style>' + p1;
   }

   var regExp = new RegExp("(?:<body>)(\{\{[^\}]*\}\})(?:<\/body>)", "g");
   var text = data.replace(regExp, wrapDiv);
   var endTag = new RegExp("(<\/body>)", "g");
   var headTag = new RegExp("(<\/head>)", "g");
   text = text.replace(endTag, injectTemplate);
   text = text.replace(endTag, injectScript);
   text = text.replace(headTag, injectStyle);
   console.log(extract(text));
   nunjucks.renderString(text, options, fn);

  });
}
