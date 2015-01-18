 
var watch_list = [];

function createOverlay() {
 var body = document.body;
 var div = document.createElement('div');
 div.classList.add('overlay');
 var template = document.getElementById('form-template').content;
 var clone = document.importNode(template.querySelector('form'), true);
 div.appendChild(clone);
 body.insertBefore(div, body.firstChild);
}

function replaceContent(key, value) {
   var update_targets = document.querySelectorAll("[data-gnp-key=" + key + "]");
   var context = {};
   context[key] = value;
   
   if(update_targets) {
     for(var i = 0; i < update_targets.length; i++) {
      var template = unescape(update_targets[i].getAttribute('data-gnp-value'));
      update_targets[i].innerHTML = nunjucks.renderString(template, context);
     }
   }
}

function bindInputs() {
 var watch_inputs = document.querySelectorAll('input.gnp-input'); 
 console.log(watch_inputs);
 for(var i = 0; i < watch_inputs.length; i++) {
   var watch_input = watch_inputs[i];
   watch_input.addEventListener("input", function() {
    console.log('hi');
    replaceContent(this.name, this.value); 
   });
 }
}

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
}

function dropbox() {
 var client = new Dropbox.Client({
    key: "j0zetok7l69qxc4"
 });
 client.authenticate(function(error, client) {
    if (error) {
        // Replace with a call to your own error-handling code.
        //
        // Don't forget to return from the callback, so you don't execute the code
        // that assumes everything went well.
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
      selectNode.addEventListener("change",convertMD);
    });

  }); 
}

createOverlay();
bindInputs();
dropbox();
