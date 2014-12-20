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
  var config_names = ['save_path', 'date_folder'];
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

