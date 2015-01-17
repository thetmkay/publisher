module.exports = function(path, options, fn) {
  var fs = require('fs');
  var nunjucks = require('nunjucks');
  var _ = require('underscore');
  fs.readFile(path, {encoding:'utf8'},function(error,data){
   if(error) {
    console.error(error);
    return;
   }   

   function replacer(match, p1, offset, string) {
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

   var regExp = new RegExp("(?:<body>)(\{\{[^\}]*\}\})(?:<\/body>)", "g");
   var text = data.replace(regExp, replacer);
   console.log(text);
   console.log(data);
   console.log(data.match(regExp));

   console.log(extract(text));
   nunjucks.renderString(text, options, fn);

  });
}
