// Copyright (c) 2014 The Wayixia Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
//

var display_tab_id = null;
var plugin_name  = "挖一下";
var block_images = {};

// create context menu
var contexts = ["page", "image", "selection","editable","link","video","audio"];
chrome.contextMenus.create({
  "title": plugin_name, 
  "contexts":contexts,  
  "onclick": function(info, tab) { 
    if(info.mediaType == 'image') {
      on_click_wa_single(info, tab); 
    } else {
      on_click_wa_all(info, tab);  
    }
  }
});

function on_click_wa_single(info, tab) {
	download_image(info.srcUrl);
}

function on_click_wa_all(info, tab) {  
  chrome.tabs.sendRequest(tab.id, { type : "display-all-images"}, function(res) {
    create_display_page(tab.id, res); 
  });
}

function on_click_open_options() {
  chrome.tabs.create({"url":chrome.extension.getURL("options.html"), "selected":true}, function(tab) {});
} 

function on_click_open_about() {
  chrome.tabs.create({"url":chrome.extension.getURL("options.html#about"), "selected":true}, function(tab) {});
} 

function on_click_screenshot(tab) {
  chrome.tabs.captureVisibleTab({format:'png'}, function(screenshotUrl) {
    create_display_screenshot(tab.id, screenshotUrl); 
  }); 
}

function on_click_full_screenshot(tab) {
  chrome.tabs.sendRequest(tab.id, { type : "full-screenshot-begin"}, function(res) {
    if(!res)
      return;
    console.log(res);
    var cols = Math.ceil(res.full_width*1.0 / res.page_width);
    var rows = Math.ceil(res.full_height*1.0 / res.page_height);
    var max_pos     = { rows: rows, cols:cols };
    var canvas      = { size: res, table: max_pos, screenshots: []};
    var current_pos = { row: 0, col: 0 };
    capture_page_task(tab, max_pos, current_pos, canvas);
  }); 
}
  
function capture_page_task(tab, max, pos, canvas) {
  console.log('capture page (row='+pos.row+', col='+pos.col);
  chrome.tabs.sendRequest(tab.id, { type : "full-screenshot-page", row:pos.row, col:pos.col}, function(res) {
    setTimeout(function() {
      chrome.tabs.captureVisibleTab({format:'png'}, function(screenshotUrl) {
        canvas.screenshots.push({row: pos.row, col: pos.col, data_url: screenshotUrl});
        pos.col++;
        pos.col = pos.col % max.cols; 
        if(pos.col == 0) {
          pos.row++;
          if(pos.row % max.rows == 0) {
            screenshot_end(tab, canvas);
            return;
          }
        }
        capture_page_task(tab, max, pos, canvas);
      });
    }, 1000);
  }); 
}


function screenshot_end(tab, canvas) {
  console.log('capture end');
  chrome.tabs.sendRequest(tab.id, { type : "full-screenshot-end"}, function(res) {
    create_display_full_screenshot(tab.id, canvas); 
  });
}

function find_display_view(url) {
  var views = chrome.extension.getViews();
  for(var i=0; i < views.length; i++) {
    var view = views[i];
    if(view.location.href == url) {
      return view;
    }
  }
}

function create_display_page(context_tab_id,  res) {  
  var manager_url = chrome.extension.getURL("display.html");
  focus_or_create_tab(manager_url, (function(id, res) { return function(view) { view.display_images(id, res) } })(context_tab_id, res));
}

function create_display_screenshot(context_tab_id,  res) {  
  var manager_url = chrome.extension.getURL("display.html");
  focus_or_create_tab(manager_url, (function(id, res) { return function(view) { view.display_screenshot(id, res) } })(context_tab_id, res));
}

function create_display_full_screenshot(context_tab_id,  res) {  
  var manager_url = chrome.extension.getURL("display.html");
  focus_or_create_tab(manager_url, (function(id, res) { return function(view) { view.display_full_screenshot(id, res) } })(context_tab_id, res));
}

function download_image(url) {
	var options = {url: url};
  var save_path = localStorage.getItem('save_path');
  
  var filename = '';
  var re = /data:(.+?);(\w+?),(.+)/;
  if(re.test(url)) { // data
    var image_type  = RegExp.$1;
    image_type = image_type.replace(/image\//, '.');
    var d = new Date();
    filename = (new Date()).valueOf()+'.'+image_type;      
  } else { // url
    filename = url.replace(/^.*[\\\/]/, '');
  }

  if(save_path) { 
    options.filename = save_path+'/'+filename;	    
  }
  chrome.downloads.download(options, function(id) {}); 
}

function block_image_add(url) {
  var images = JSON.parse(localStorage.getItem('block_images')) || {};
  images[url] = 1;
  localStorage.setItem('block_images', JSON.stringify(images));
  console.log(images);
}

function block_image_remove(url) {
  var images = JSON.parse(localStorage.getItem('block_images')) || {};
  console.log(images);
  delete images[url];
  console.log(images);
  localStorage.setItem('block_images', JSON.stringify(images));
  console.log(images);
}

function is_block_image(url) {
  var images = JSON.parse(localStorage.getItem('block_images')) || {};
  return !!images[url];
}

function focus_or_create_tab(url, func) {
  var view = find_display_view(url);
  if(view) {
    view.focus();
    func(view);
  } else {
    // view is not created
    chrome.tabs.onUpdated.addListener(function listener(tab_id, changed_props) {
      if(tab_id != display_tab_id || changed_props.status != "complete")
        return;
      chrome.tabs.onUpdated.removeListener(listener);
      // lookup views
      var view = find_display_view(url);
      if(view) {
        func(view);
      }
    });

    chrome.tabs.create({"url":url, "selected":true}, function on_tab_created(tab) { display_tab_id = tab.id; });
  }
}

