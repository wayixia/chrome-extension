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
  chrome.downloads.download({url: info.srcUrl}, function(id) {}); 
  //chrome.tabs.sendRequest(tab.id, { type : "display-single-image", src: info.srcUrl}, function(res) {
    // create_display_page(tab.id, res); 
  //});
}

function on_click_wa_all(info, tab) {  
  chrome.tabs.sendRequest(tab.id, { type : "display-all-images"}, function(res) {
    create_display_page(tab.id, res); 
  });
}

function on_click_open_options() {
  chrome.tabs.create({"url":chrome.extension.getURL("options.html"), "selected":true}, function(tab) {});
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


