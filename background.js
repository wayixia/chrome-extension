// Copyright (c) 2013 The Wayixia Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
//

var display_tab_id = null;
var plugin_name  = "挖一下";

// create context menu
var contexts = ["page", "image", "selection","editable","link","video","audio"];
chrome.contextMenus.create({
  "title": plugin_name, 
  "contexts":contexts,  
  "onclick": function(info, tab) { 
    //console.log(info);
    if(info.mediaType == 'image') {
      // single
      on_click_wa_single(info, tab); 
    } else {
      // all images
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

function on_click_screenshot(tab) {
  chrome.tabs.sendRequest(tab.id, { type : "capture-full-page"}, function(res) {
    console.log(res);

    var current_pos = {rows: 0, cols: 0};
    capture_page_task(tab, {rows: res.rows, cols:res.cols}, current_pos);
    //setTimeout(function() {console.log('start capture');}, 3000);
    //create_display_page(tab.id, res);
    //capture_start(res.full_width, res.full_height, res.page_width, res.page_height);
    //chrome.tabs.sendRequest(tab.id, { type : "capture-next-page"}, function(res) {
    //  var scroll_left = res.left;
    //  var scroll_top  = res.top;
    //  var page_width  = res.width;
    //  var page_height = res.height;
    //  capture_page(scroll_left, scroll_top, page_width, page_height);
    //});
  }); 
  //chrome.tabs.captureVisibleTab({format:'png'}, function(screenshotUrl) {
  //  console.log(screenshotUrl);
  //});
}
  
function on_click_open_options() {
  chrome.tabs.create({"url":chrome.extension.getURL("options.html"), "selected":true}, function(tab) {});
} 

function on_click_open_about() {
  chrome.tabs.create({"url":chrome.extension.getURL("options.html#about"), "selected":true}, function(tab) {});
} 

function capture_page_task(tab, max, pos) {
  console.log('capture page (rows='+pos.rows+', cols='+pos.cols);
  chrome.tabs.sendRequest(tab.id, { type : "capture-page", rows:pos.rows, cols:pos.cols}, function(res) {
    // capture page
    //chrome.tabs.captureVisibleTab({format:'png'}, function(screenshotUrl) {
      //console.log(screenshotUrl);
      pos.cols++;
      pos.cols = pos.cols % max.cols; 
      if(pos.cols == 0) {
        pos.rows++;
        if(pos.rows % max.rows == 0) {
          // stop capture
          capture_stop(tab);
          return;
        }
      }
      setTimeout(function() { capture_page_task(tab, max, pos) }, 1000);
    //});
  }); 
}


function capture_stop(tab, imgs) {
  console.log('capture end');
  chrome.tabs.sendRequest(tab.id, { type : "capture-page-stop"}, function(res) {
    //create_display_page(tab_id, imgs) { } 
  });
}

function find_display_view(url) {
  // lookup views
  var views = chrome.extension.getViews();
  for(var i=0; i < views.length; i++) {
    var view = views[i];
    if(view.location.href == url) {
      return view;
    }
  }
}

function on_tab_created(tab) {
  display_tab_id = tab.id;
}

function create_display_page(context_tab_id, res) {  
  var manager_url = chrome.extension.getURL("display.html");
  focus_or_create_tab(manager_url, context_tab_id, res);
}

function download_image(url) {
	var options = {url: url};
  var save_path = localStorage.getItem('save_path');
  if(save_path) 
    options.filename = save_path+'/'+options.url.replace(/^.*[\\\/]/, '');	    
  chrome.downloads.download(options, function(id) {}); 
}

function focus_or_create_tab(url, context_tab_id, res) {
  var view = find_display_view(url);
  if(view) {
    view.focus();
    view.displayValidImages(context_tab_id, res);
  } else {
    // view is not created
    chrome.tabs.onUpdated.addListener(function listener(tab_id, changed_props) {
      if(tab_id != display_tab_id || changed_props.status != "complete")
        return;
      chrome.tabs.onUpdated.removeListener(listener);
      // lookup views
      var view = find_display_view(url);
      if(view) {
        view.displayValidImages(context_tab_id, res);
      }
    });

    chrome.tabs.create({"url":url, "selected":true}, on_tab_created);
  }
}


