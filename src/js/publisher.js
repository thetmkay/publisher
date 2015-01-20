
var nunjucks = require('./nunjucks');
var marked = require('./marked');

var watchlist = require('./watchlist')();
var context = require('./context')(globals.template);
var socket = io();


function renderFile(extension, text) {
  switch(extension) {
    case 'md': 
       return marked(text);
    default:
       return text;
  }
}

function createOverlay() {
 var body = document.body;
 var overlay = document.createElement('div');
 overlay.id = 'gnp-overlay';
 overlay.classList.add('hidden');
 var template = document.getElementById('form-template').content;
 var clone = document.importNode(template.querySelector('form'), true);
 overlay.appendChild(clone);
 body.insertBefore(overlay, body.firstChild);
}

function replaceContent(key, value) {
   var update_targets = document.querySelectorAll("[data-gnp-key=" + key + "]");
   context.update(key, value); 
   if(update_targets) {
     for(var i = 0; i < update_targets.length; i++) {
      var template = unescape(update_targets[i].getAttribute('data-gnp-value'));
      update_targets[i].innerHTML = nunjucks.renderString(template, context.get());
     }
   }
}

function bindInputs() {
 var watch_inputs = document.querySelectorAll('input.gnp-input'); 
 for(var i = 0; i < watch_inputs.length; i++) {
   var watch_input = watch_inputs[i];
   watch_input.addEventListener("input", function() {
    replaceContent(this.name, this.value); 
   });
 }
}

function bindFileReaders(){
  var file_inputs = document.querySelectorAll('input.gnp-file-input');

  function readFile(){
       var selected_file = this.files[0];
       var key = this.name;
       var extension = this.getAttribute('data-gnp-type'); //alt: use actual filename extension
       var reader = new FileReader();
       reader.onload = function() {
         var rendered_text = renderFile(extension, this.result);
         replaceContent(key,rendered_text);
       };
       watchlist.add(selected_file, key, readFile.bind(this));
       reader.readAsText(selected_file, 'utf8');
  }

  for(var i = 0; i < file_inputs.length; i++) {
     file_inputs[i].addEventListener('change',readFile);
  }  
}

function bindSave() {

}

function bindPublish() {
  var button = document.getElementById('gnp-publish');
  if(!button) {
   console.error("Could Not Find Publish Button");
   return;
  }

  function onPublish() {
    console.log(context.print());

    var req = new XMLHttpRequest();
    req.open('POST', '/publish/remote');
    req.onload = function(){ 
      console.log(this.responseText); 
    }

    req.addEventListener('error', function(error) {
	console.log(error);
    });
    req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    req.send(context.get());
  }

  button.addEventListener("click", onPublish);
}

function toggleOverlay() {
  var overlay = document.getElementById('gnp-overlay').classList.toggle('hidden');  
}

function switchContexts(context_id) {
  var overlay = document.getElementById('gnp-overlay');
  //switch display to other context
  if(context.isSameContext(context_id)) {
     console.log("Already in context");
     return;
  }

  context.switchContext(context_id);
  var context_obj = context.get();
  for(var field in context_obj) {
	replaceContent(field, context_obj[field]);
  }


}

/*
function addToWatchList(node, file){
  
  if(!watch_list[file]) {
   watch_list[file] = [];
  }

  watch_list[file].push(node);
  console.log(watch_list);
}

function removeFromWatchList(node, file){ 
  if(!watch_list[file]) {
   return;
  }

  var index = _.indexOf(list, node);
  watch_list.slice(index, 1);
  console.log(watch_list);
}*/
/*
function dropbox() {
 var client = new Dropbox.Client({
    key: dropbox_key//"j0zetok7l69qxc4"
 });
 client.authenticate(function(error, client) {
    if (error) {
        console.log(error);
        return;
    }

   function getFiles(extension, callback) {
     return client.search('/posts/', '.' + extension, {}, callback);
   }

   function convertMD() {
    var choice = unescape(this.value);

    addToWatchList(this,unescape(this.value));

    var selectKey = this.name;
    readFile(choice, function(data) {
      var conversion = marked(data);
      replaceContent(selectKey, conversion);
    });
   }

  function readFile(path, callback) {
    client.readFile(path, function(error, data) {
            if (error)
                console.error(error)
            else
                callback(data);
    });
  }

   var selectComp = document.querySelector('select.gnp-input[data-gnp-type="md"]');
   var extension = 'md';

   var optionPromise = new Promise(function(resolve, reject) {
    getFiles(extension, function(error, data) {
    if (error)
     reject(data);
    else
     resolve(data);
    });
   });

    var selectPromise = filepicker(selectComp, optionPromise);

    selectPromise.then(function(selectNode) {
      convertMD.call(selectNode);
      selectNode.addEventListener("change",convertMD);
    });

  }); 
}

*/
function watch(filename) {
  socket.on('connected', function(msg) {
	console.log(msg);
  });
}

function bindKeys() {
/*
  var inputs = document.querySelectorAll('input')
  for(var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("keypress", function(event) {
      event.stopDefaultPropogation();
    }
  }
*/
  window.addEventListener("keypress", function(event) {
    if(document.activeElement.tagName.toLowerCase() === 'input' ||
       document.activeElement.tagName.toLowerCase() === 'select') {
      return true;
    }
    //todo: support newer standards (ie event.key)
    if(event.which === 45) { // '-' key
      toggleOverlay();
    } else if(event.which <= 57 && event.which >= 48) { // '0' to '9' keys
      switchContexts(event.which - 48);
    }
  });
}

createOverlay();
bindInputs();
bindFileReaders();
bindPublish();
bindKeys();
//dropbox();
//watch();
setInterval(watchlist.poll, 3000);
