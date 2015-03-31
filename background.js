// Copyright (c) 2014 The Wayixia Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
//

var display_tab_id = null;
var plugin_name  = chrome.i18n.getMessage('menuDigImages');
var block_images = {};

// check new version for helper
//if(user_config_is_new()) {
//  // display new features of wayixia extension
//  console.log('this is help!');
//  //create_upgrade_page();
//}

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
    res = res || {};
    res.track_from = info.track_from;
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
  chrome.tabs.sendRequest(tab.id, { type : "screenshot-begin"}, function(res) {
    setTimeout(function() {
      chrome.tabs.captureVisibleTab({format:'png'}, function(screenshotUrl) {  
        chrome.tabs.sendRequest(tab.id, { type : "screenshot-end"}, function(res) {
          create_display_screenshot(tab.id, screenshotUrl); 
        });
      });
    }, 1000);
  })
}

function on_click_full_screenshot(tab) {
  chrome.tabs.sendRequest(tab.id, { type : "screenshot-begin"}, function(res) {
    if(!res)
      return;
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
  chrome.tabs.sendRequest(tab.id, { type : "screenshot-page", row:pos.row, col:pos.col}, function(res) {
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
  chrome.tabs.sendRequest(tab.id, { type : "screenshot-end"}, function(res) {
    create_display_full_screenshot(tab.id, canvas); 
  });
}

function find_display_view(url) {
  var views = chrome.extension.getViews();
  for(var i=0; i < views.length; i++) {
    var view = views[i];
    var view_url = view.location.protocol + "//"+view.location.host+view.location.pathname;
    if(view_url == url) {
      return view;
    }
  }
}

function create_display_page(context_tab_id,  res) {  
  var manager_url = chrome.extension.getURL("display.html");
  focus_or_create_tab(manager_url, (function(id, res) { return function(view) { view.display_images(id, res) } })(context_tab_id, res));
}

function create_display_screenshot(context_tab_id,  res) {  
  var manager_url = chrome.extension.getURL("screenshot.html");
  focus_or_create_tab(manager_url, (function(id, res) { return function(view) { view.display_screenshot(id, res) } })(context_tab_id, res));
}

function create_display_full_screenshot(context_tab_id,  res) {  
  var manager_url = chrome.extension.getURL("screenshot.html");
  focus_or_create_tab(manager_url, (function(id, res) { return function(view) { view.display_full_screenshot(id, res) } })(context_tab_id, res));
}

function create_upgrade_page() {  
  var manager_url = 'http://wayixia.com/chrome/features.html#v.'+chrome.runtime.getManifest().version;
  focus_or_create_tab(manager_url, function(view) { });
}

function download_image(url) {
  var options = {url: url};
  chrome.downloads.download(options, function(id) {}); 
}

function get_date_path() {
  var date = new Date();
  var month = date.getMonth()+1; //)>9?date.getMonth():'0'+date.getMonth();
  var day = date.getDate();      //>9?date.getMonth():'0'+date.getDate();
  month = month>9?month:('0'+month);
  day   = day>9?day:('0'+day);
  date_path = date.getFullYear()+'-'+month+'-'+day;
  return date_path;
}

function get_save_path() {
  var save_path = user_config_get('save_path');
  var date_folder = (user_config_get('date_folder') != '0');
  if(save_path != "") {
    save_path += "/";
  }
	if(date_folder) {
    var date_path = get_date_path();
    if(date_path != "") {
		  save_path += date_path + "/";
	  }
  }
	save_path = save_path.replace(/[\\\/]+/, '/');

	return save_path;
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
        view.focus();
        func(view);
      }
    });

    chrome.tabs.create({"url":url, "selected":true}, function on_tab_created(tab) { display_tab_id = tab.id; });
  }
}

// add commands listener
chrome.commands.onCommand.addListener(function(command) {
  if (command == "toggle-wa-all") {
    // Get the currently selected tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      // Toggle the wa all images
      on_click_wa_all({}, tabs[0]);
      //var current = tabs[0]
      //chrome.tabs.update(current.id, {'pinned': !current.pinned});
    });
  }
});


chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) {
  // if downloaded not by wayixia, then use default
  if(item.byExtensionId == chrome.runtime.id) {
	  var save_path = get_save_path();
	  var filename = "";
	  var re = /data:(.+?);(\w+?),(.+)/;
    if(re.test(item.url)) { // data
      filename = (new Date()).valueOf();      
    } else {
      // replace ilegal char
      filename = item.filename.replace(/\.\w+$/, '').replace(/[:*?\"<>|]/, "-") + "-w" + item.id;
	  }

    suggest({filename: save_path + filename + "." + item.mime.replace(/\w+\//, ''), conflict_action: 'uniquify',conflictAction: 'uniquify'});
  } else {
    //suggest({conflict_action: 'uniquify',conflictAction: 'uniquify'});
  }
});

console.log('background.js init');

