async function create_category_selection (framework, level, value){

    if(framework != "def"){

        var config = await get_config_processor(framework);

        remove_unneeded_selections(level);

        var div_id = framework + "-level" + level + "-container";

        var div = document.createElement('div');
        div.id = div_id;
        div.className = "category_selection";

        var dropdown = document.createElement('select');
        dropdown.id = framework + "-level" + level;
        dropdown.name = framework + "-level" + level;
        dropdown.className = "category_dropdown";

        build_dropdown(dropdown.id, framework, level, value);

        div.appendChild(dropdown);

        document.body.appendChild(div);
        dropdown.onchange = function (){
            if(level < config["NUMBER_OF_LEVELS"]){
                create_category_selection(framework, level + 1, dropdown.value);
            }
        }
    }
}

function build_dropdown(id_dropdown, framework, level, value){

    //return new Promise(function (resolve, reject){
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var def_opt = document.createElement('option');
                    def_opt.text = " -- Select a value -- ";
                    def_opt.value = "def";
                    document.getElementById(id_dropdown).add(def_opt);

                    var fields = JSON.parse(xhr.responseText);

                    fields.forEach(function (entry) {
                        add_option(id_dropdown, entry);
                    });
                } else {
                    console.error("Error loading options: " + xhr.status);
                }
            }
        };
        xhr.open("GET", "load_fields?framework=" + encodeURIComponent(framework) + "&level=" + encodeURIComponent(level) + "&value=" + encodeURIComponent(value), true);
        xhr.send();
    //});
}

function add_option(id_dropdown, value){
    var option = document.createElement('option');
    option.text = value;
    option.value = value;

    document.getElementById(id_dropdown).add(option);
}

function remove_unneeded_selections (level){
    var all_divs = document.querySelectorAll("div.category_selection");
    if(all_divs){
        all_divs.forEach(function(one_selection){
            var check_level = parseInt(one_selection.id.split("level")[1]);
            if (check_level >= level){
                one_selection.remove();
            }
        });
    }
}

async function add_field() {

    await post_data();
    show_all_selected_fields();
}

async function post_data(){
    var framework = document.getElementById("select-framework").value;

    var level = await get_config_processor(framework);
    var level = level["NUMBER_OF_LEVELS"];

    var field = document.getElementById(framework + "-level" + level).value;
    var forgoing = document.getElementById(framework + "-level" + (level - 1)).value;

    var value = {
        "framework": framework,
        "field": field,
        "foregoing": forgoing,
    };

    return new Promise(function (resolve, reject){
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/add_field", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {
            if(xhr.readyState === XMLHttpRequest.DONE) {
                if(xhr.status === 200){
                    resolve("Field sent successfully!!");
                } else {
                    reject("Error: " + xhr.status);
                }
            }
        };

        xhr.send(JSON.stringify(value));
    });

}

function remove_field(framework, field_to_remove, field_category) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "/delete_field?framework=" + encodeURIComponent(framework) +
        "&value=" + encodeURIComponent(field_to_remove) + "&value_category=" +
        encodeURIComponent(field_category), true);
    xhr.send();

    show_all_selected_fields();
}

function show_all_selected_fields() {
    var div = document.getElementById('list-selected-values-container');
    var all_ols = div.querySelectorAll('ol');
    if(all_ols) {
        all_ols.forEach(function(ol){
           ol.remove();
        });
    }

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE){
            if (xhr.status === 200){
                var data = JSON.parse(xhr.responseText);
                var keys = Object.keys(data);
                keys.sort();
                keys.forEach(function (key) {
                    var list = document.createElement('ol');
                    list.id = key;
                    var list_title = document.createElement('h2');
                    list_title.textContent = key;
                    list.appendChild(list_title);

                    var values = data[key];
                    values.sort();
                    values.forEach(function(entry){
                        //document.write(entry);
                        add_list_entry(list, entry);
                    });
                    div.appendChild(list);
                });
            }
        }
    };

    xhr.open('GET', '/get_all_stored_values', true);
    xhr.send();
}

function add_list_entry(list, value, forgoing_value) {

    var list_entry = document.createElement('li');
    var delete_button = document.createElement('button');
    list_entry.textContent = value;
    delete_button.textContent = "Delete field";
    delete_button.onclick = function () {
        remove_field(list.id, value, forgoing_value);
    };

    list_entry.appendChild(delete_button);
    list.appendChild(list_entry);
}

function write_json() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/write_json', true);
    xhr.send();

    var link_for_download = document.createElement('a');
    link_for_download.textContent = "If download does not start automatically, click this link.";
    link_for_download.href = "http://localhost:5000/write_json";
    document.body.appendChild(link_for_download);

}

function get_config_processor(framework) {

    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {

                    var config = JSON.parse(xhr.responseText);
                    resolve(config);

                } else {
                    reject("Error: " + xhr.status);
                }
            }
        };
        xhr.open('GET', '/get_config?framework=' + encodeURIComponent(framework), true);
        xhr.send();
    });
}
