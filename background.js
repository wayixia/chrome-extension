// Copyright (c) 2014 The Wayixia Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
//

var plugin_name  = chrome.i18n.getMessage('menuDigImages');
var block_images = {};
var wayixia_nickname = "";
var wayixia_uid = 0;
// check new version for helper
if(user_config_is_new()) {
  // display new features of wayixia extension
  setTimeout(create_upgrade_page(), 60*1000);
}

function user_is_login()
{
  return ( wayixia_nickname != "" );
}

function ajax( json ) 
{
  var http_call = new XMLHttpRequest();
  http_call.onreadystatechange = (function(callee) { return function() {
    if (this.readyState==4) {  // 4 = "loaded"
      if (this.status==200) { // 200 = OK
        console.log(this.responseText);
        try {
          var result = JSON.parse(this.responseText);
          if( json.oncomplete ) {
            json.oncomplete( result );
          }
        } catch(e) {
          console.log(e);
          if( json.onerror ) {
            json.onerror( this );
          }
        }
      } else {
        if( json.onerror ) {
          json.onerror( this );
        }
        console.log("Problem retrieving data");
      }
    }
  }})(arguments.callee); 
  if( json.command.indexOf("?") == -1 ) {
    http_call.open(json.method, json.command + "?rnd="+Math.floor(+new Date/1E7), true);
  } else {
    http_call.open(json.method, json.command + "&rnd="+Math.floor(+new Date/1E7), true);
  }
  //http_call.open("GET", "http://www.wayixia.com/?mod=user&action=status&inajax=true&rnd="+Math.floor(+new Date/1E7), true);
  http_call.send(null);
}

setTimeout(function() {
  var http_call = new XMLHttpRequest();
  http_call.onreadystatechange = (function(callee) { return function() {
    if (this.readyState==4) {  // 4 = "loaded"
      if (this.status==200) { // 200 = OK
        console.log(this.responseText);
        try {
          var rules = JSON.parse(this.responseText);
          if(rules) {
            filter_rule_version(rules.version);
            filter_rule_set(rules.rules);
          }
        } catch(e) {
          console.log(e);
        }
      } else {
        console.log("Problem retrieving data");
      }
      // update per hour
      setTimeout(callee, 60*60*1000);
    }
  }})(arguments.callee); 
  http_call.open("GET", "http://www.wayixia.com/filter-rules.json?"+Math.floor(+new Date/1E7), true);
  http_call.send(null);
}, 1000)

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
//  chrome.tabs.sendRequest(tab.id, { type : "screenshot-begin"}, function(res) {
//    setTimeout(function() {
      chrome.tabs.captureVisibleTab({format:'png'}, function(screenshotUrl) {  
        //chrome.tabs.sendRequest(tab.id, { type : "screenshot-end"}, function(res) {
          create_display_screenshot(tab.id, screenshotUrl, tab.url); 
        //});
      });
//    }, 1000);
//  })
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
  chrome.tabs.sendRequest( tab.id, { type : "screenshot-end" }, function(res) {
    create_display_full_screenshot(tab.id, canvas, tab.url); 
  });
}

var cache_display = {};

function get_display_cache( tab_id ) {
  var obj = cache_display[tab_id];
  //delete cache_display[tab_id];
  return obj;
}

function create_display_page(context_tab_id,  res) {  
  create_tab( { url: chrome.extension.getURL("display.html"), callback : ( function( id, res ) { return function( tab_id ) { 
    cache_display[tab_id] = {
      ctx_tab_id : id,
      data : res 
    }
  } } )( context_tab_id, res ) } ) ;
}

function create_display_screenshot(context_tab_id,  res, url) {  
  create_tab( { url : chrome.extension.getURL("screenshot.html"), callback : ( function( id, res ) { return function( tab_id ) { 
    cache_display[tab_id] = {
      ctx_tab_id : id,
      data : res,
      url : url,
      type : "screenshot"
    };
    //view.display_screenshot(id, res, url);
  } } )( context_tab_id, res ) } );
}

function create_display_full_screenshot(context_tab_id,  res, url) {  
  create_tab( { url : chrome.extension.getURL("screenshot.html"), callback : ( function( id, res ) { return function( tab_id ) { 
    cache_display[tab_id] = {
      ctx_tab_id : id,
      data : res,
      url : url,
      type : "full_screenshot"
    };

    // view.display_full_screenshot(id, res, url);
  } } )( context_tab_id, res ) } );
}

/** show features of the extension */
function create_upgrade_page() {  
  var manager_url = "http://wayixia.com/chrome/#v."+chrome.runtime.getManifest().version;
  focus_or_create_tab(manager_url, function(view) { });
  user_config_version_ok();
}


function edit_image( url, view ) {
  focus_or_create_tab(chrome.extension.getURL("screenshot.html") + "?img=" + url, function(view) { });
}

var download_items = {};

function download_image(url, view) {
  var options = {url: url};
  chrome.downloads.download(options, function(id) {
    if(!id) {
      view.background_warning({
        error: chrome.runtime.lastError,
        page: view.location,
        url: url
      });
    } else {
      download_items[id] = {
        url: url,
        view: view
      };
    }
  }); 
}

function get_date_path() {
  var date = new Date();
  var month = date.getMonth()+1; 
  var day = date.getDate();   
  month = month>9?month:('0'+month);
  day   = day>9?day:('0'+day);
  date_path = date.getFullYear()+'-'+month+'-'+day;
  return date_path;
}

function get_save_path() {
  var save_path = user_config_get('save_path') || "";
  var date_folder = (user_config_get('date_folder') != '0');
  if( ( save_path != "" ) ) {
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

function create_tab( json ) {
  var display_tab_id;
  // view is not created
  chrome.tabs.onUpdated.addListener( function listener( tab_id, changed_props ) {
    console.log(tab_id + "->" + changed_props.status );
    if(tab_id != display_tab_id || changed_props.status != "complete")
      return;
    chrome.tabs.onUpdated.removeListener(listener);
    // lookup views
    chrome.tabs.get( tab_id, function( tab ) {
      var views = chrome.extension.getViews( { windowId: tab.windowId } );
      var view = views[0];
      view.focus();
    } ); 
  });
  
  chrome.tabs.create( { "url" : json.url, "selected" : true }, function on_tab_created( tab ) {
    display_tab_id = tab.id; 
    json.callback( tab.id ); 
  } );
}

function focus_or_create_tab(url, func) {
  var display_tab_id;
  // view is not created
  chrome.tabs.onUpdated.addListener( function listener( tab_id, changed_props ) {
    console.log(tab_id + "->" + changed_props.status );
    if(tab_id != display_tab_id || changed_props.status != "complete")
      return;
    chrome.tabs.onUpdated.removeListener(listener);
    // lookup views
    chrome.tabs.get( tab_id, function( tab ) {
      var views = chrome.extension.getViews( { windowId: tab.windowId } );
      var view = views[0];
      view.focus();
      func(view); 
    } ); 
  });
  
  chrome.tabs.create( { "url" : url, "selected" : true}, function on_tab_created( tab ) { display_tab_id = tab.id; } );
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
    console.log(item.id + ":" + item.state)
	  var save_path = get_save_path();
	  var filename = "";
	  var re = /data:(.+?);(\w+?),(.+)/;
    if(re.test(item.url)) { // data
      filename = (new Date()).valueOf();      
    } else {
      // replace ilegal char
      filename = item.filename.replace(/\.\w+$/, '').replace(/[:*?\"<>|]/, "-") + "-w" + item.id;
	  }

    var ftype = "";
    if( item.mime != "" ) {
       ftype = "." + item.mime.replace(/\w+\//, '');
    }
    suggest({filename: save_path + filename + ftype , conflict_action: 'uniquify',conflictAction: 'uniquify'});
  } else {
    //suggest({conflict_action: 'uniquify',conflictAction: 'uniquify'});
  }
});

chrome.downloads.onChanged.addListener(function(download) {
  var item = download_items[download.id];
  if(item) {
    if(download.error && item.view) {
      item.error = download.error.current;
      item.view.background_warning({
        error: download.error.current,
        page: item.view.location,
        url: item.url,
      });
    }
    delete download_items[download.id];
  }
});

chrome.extension.onMessage.addListener( function( o ) {
  console.log(o.action);
  switch( o.action ) {
  case "userstatus":
    ajax( { command: "http://www.wayixia.com/?mod=user&action=status&inajax=true",
      method: "GET",
      oncomplete : function( r ) {
        console.log( r );
        wayixia_nickname = "";
        wayixia_uid = 0;
        if( r.header == 0 && r.data ) {
          if( r.data.nickname ) {
            wayixia_nickname = r.data.nickname;
          }
          if( r.data.uid ) {
            wayixia_uid = r.data.uid;
          }
        }
      }
    } );    
    break;
  }
} );


console.log('background.js init');

