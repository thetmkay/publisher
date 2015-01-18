function Context(template) {
  var template = template || {};
  var c_index = 0;
  var list = [];

  var module = {};
  
  function stretchTo(index) {
   while(index >= list.length) {
    list.push(clone(template));
   }
  }

  function clone(obj) {
   return Object.create(Object.prototype,obj);
  }

  function switchContext(index) {
   c_index = index;
   stretchTo(index); 
  }
  module.switchContext = switchContext;

  function get(index) {
   if(!index && index !== 0) {
     return list[c_index];
   }

   stretchTo(index);

   return list[c_index];
  }
  module.get = get;

  function update(index, key, value) {
    
    if(value === undefined) {
      value = key;
      key = index;
      index = c_index;    
    }

    stretchTo(index);

    get(index)[key] = value;
  }
  module.update = update;

  function print(index) {
   index = index || c_index;

   return JSON.stringify(get(index));
  }
  module.print = print;

  return module;
}
