
var socket = io();
var patch = require('virtual-dom/patch');
var diff = require('virtual-dom/diff');
var virtualize = require('html-virtualize');
var marked = require('./marked');

init();


function init() {
		
	var watchlist = require('./watchlist')();
	var context_id = 0;

	socket.on('change dom', function(id , new_html, selector) {
	  if(id !== context_id || !new_html) {
		return;
	  }
	
	  var new_tree = virtualize(new_html);
	  var container = document.querySelector(selector);
	  var patches = diff(virtualize(container.outerHTML), new_tree); 
	  patch(container,patches);
	});

	function renderFile(extension, text) {
	  switch(extension) {
	    case 'md': 
	       return marked(text);
	    default:
	       return text;
	  }
	}

	function updateContext(key, value, filename) {
	  socket.emit('update context', context_id, key, value, filename);
	}

	function bindInputs() {
	 var watch_inputs = document.querySelectorAll('input.gnp-input'); 
	 for(var i = 0; i < watch_inputs.length; i++) {
	   var watch_input = watch_inputs[i];
	   watch_input.addEventListener('input', function() {
	    updateContext(this.name, this.value); 
	   });
	   watch_input.addEventListener('blur', hideInput);
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
		 updateContext(key,rendered_text, selected_file.name);
	       };
	       watchlist.add(selected_file, key, readFile.bind(this));
	       reader.readAsText(selected_file, 'utf8');
	       hideInputElement.call(this, selected_file.name);
	  }

	  for(var i = 0; i < file_inputs.length; i++) {
	     file_inputs[i].addEventListener('change',readFile);
	  }  
	}
	
	function hideInputElement(value) {
		var input = this;

		var container = input.parentNode;
		container.querySelector('.gnp-input-value').innerHTML = value;
		container.classList.remove('trigger-edit');

	}

	function hideInput() {
		var value = this.value;
		hideInputElement.call(this, value);
	}

	function onFieldClick() {
		var mod = this.querySelector('.gnp-input-mod');
		mod.classList.add('trigger-edit');
		var input = this.querySelector('.gnp-input, .gnp-file-input');
		var value = this.querySelector('.gnp-input-value').innerHTML;
		if(input.type === 'file'){
			value = '';
		}
		input.value = value;
		input.focus();
	}

	function bindFields() {
		var fields = document.querySelectorAll('.gnp-json-field'); 

		for(var i = 0; i < fields.length; i++) {
			fields[i].addEventListener('click', onFieldClick);	
		}
	}

	function bindSave() {
	  
	  var button = document.getElementById('gnp-save');
	  if(!button) {
	   console.error("Could Not Find Save Button");
	   return;
	  }
	  button.addEventListener('click', function() {	
		socket.emit('save context', context_id);
	  });
	}

	function bindPublish() {
	  var button = document.getElementById('gnp-publish');
	  if(!button) {
	   console.error("Could Not Find Publish Button");
	   return;
	  }
	  button.addEventListener('click', function() {	
		socket.emit('publish context', context_id);
	  }); 
	}

	function toggleOverlay() {
	  var overlay = document.getElementById('gnp-overlay').classList.toggle('hidden');  
	}

	function switchContexts(new_id) {
	    if(context_id === new_id) {
		//no need to switch
		return;
	    }
	    document.querySelector('[data-gnp-context="' + context_id + '"]').classList.remove('active');
	    document.querySelector('[data-gnp-context="' + new_id + '"]').classList.add('active');
	    //console.log('switch to ' + new_id);
	    context_id = new_id;
	    socket.emit('switch context', context_id);
	}


	function bindKeys() {

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

	function bindSwitches() {
		var switches = document.querySelectorAll('.gnp-switch');
		for(var i = 0; i < switches.length; i++) {
			switches[i].addEventListener('click', function(e) {
				e.preventDefault();
				switchContexts(this.getAttribute('data-gnp-context'));
			});
		}
	}

	function bindAll() {
	  bindInputs();
	  bindFields();
	  bindFileReaders();
	  bindPublish();
	  bindSave();
	  bindKeys();
	  bindSwitches();
	}
	//dropbox();
	//watch();
	bindAll();
	setInterval(watchlist.poll, 3000);
}
