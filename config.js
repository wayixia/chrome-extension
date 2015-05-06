//
//wayixia chrome plugin config api
//

function user_config_is_new() {
  var current_version = user_config_get('wayixia_version');
  console.log(current_version + ' -> ' + chrome.runtime.getManifest().version);
  var result = (parseFloat(current_version, 10) < parseFloat(chrome.runtime.getManifest().version, 10));
  user_config_set('wayixia_version', chrome.runtime.getManifest().version);
  return result;
}

function user_config_load(data) {
  var config = JSON.parse(data);
  if(config) {
    for(var name in config) {
      localStorage.setItem(name, config[name]);
    }
  }
}

function user_config_tostring() {
  var config_names = ['save_path', 'date_folder', 'view_type'];
  var config = {};
  for(var i=0; i<config_names.length; i++) {
    var name = config_names[i];
    config[name] = user_config_get(name);
  }

  console.log(JSON.stringify(config));
}

function user_config_set(key, value) {
  localStorage.setItem(key, value);
}

function user_config_get(key) {
  return localStorage.getItem(key);
}



function block_image_add(url) {
  var images = JSON.parse(localStorage.getItem('block_images')) || {};
  images[url] = 1;
  localStorage.setItem('block_images', JSON.stringify(images));
}

function block_image_remove(url) {
  var images = JSON.parse(localStorage.getItem('block_images')) || {};
  delete images[url];
  localStorage.setItem('block_images', JSON.stringify(images));
}

function is_block_image(url) {
  var images = JSON.parse(localStorage.getItem('block_images')) || {};
  return !!images[url];
}

function block_images_all() {
  return JSON.parse(localStorage.getItem('block_images')) || {};
}

function view_type_set(t) {
  user_config_set('view_type', t);
}

function view_type() {
  var type = user_config_get('view_type');
  if( type == "size_1" 
     || type == "size_2" 
     || type == "size_3") 
  {
    return type;;
  } 

  return "size_2";
}

// warnnings
function warnnings_clear() {

}

function warnings_add(item) {}

function warnnings() {
  return [1];
}

// set/get version of filter rules
function filter_rule_version() {
  if(arguments.length > 0) {
    var v = parseInt(arguments[0], 10);
    if(!isNaN(v)) {
      user_config_set('filter_rule_version', v);
    }
  } else {
    return user_config_get('filter_rule_version');
  }
}

// enable/disable filter rule
function filter_rule_enable(b) {
  user_config_set('filter_rule_enable', b?1:0);
}

// filter rule is enabled
function filter_rule_is_enabled() {
  var enabled = user_config_get('filter_rule_enable'); 
  return (parseInt(enabled, 10) != 0);
}

function filter_rule_get() {
  var rules_config = JSON.parse(user_config_get('filter_rules'));
  if(rules_config && (typeof rules_config == "object")) {
  } else {
    rules_config = {version: 0, rules: {}};
  }
  if(rules_config.version === undefined || isNaN(rules_config.version))
    rules_config.version = 0;

  if(rules_config.rules === undefined)
    rules_config.rules = {};
  return rules_config; 
}

function filter_rule_set(rules) {
  var rules_config = filter_rule_get();
  for(var name in rules) {
    rules_config.rules[name] = rules[name];
  }
  user_config_set('filter_rules', JSON.stringify(rules_config));
}





