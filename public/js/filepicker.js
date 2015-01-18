function filepicker(component, optionPromise) {

    function render(component, optionList) {

//        var component = document.createElement('select');
//        component.classList.add('gnp-select-' + extension);
//        component.name = name;
        comp_string = "";

        for (var i = 0; i < optionList.length; i++) {
            comp_string += '<option value=' + escape(optionList[i].path) + '>' + optionList[i].name + '</option>';
        }

        component.innerHTML = comp_string;

        return component;
    }

    return new Promise(function(resolve, reject) {
        optionPromise.then(function(value) {
                resolve(render(component, value));
            });
            //add error case
    });
};
