/*-------------------------------------------------------
 $ file:  wayixia.js
 $ powered by wayixia.com
 $ date: 2014-11-8
 $ author: Q 
---------------------------------------------------------*/

var t = null;
var content_load_ok = false;
var g_screenshot_zoom = 100;
var source_tab_id = null;
var request_data = {imgs: null, data: null};
var g_screenshot_dialog = null;
function is_block_image(url) {
  var extension = chrome.extension.getBackgroundPage();
  return extension.is_block_image(url); 
}

function initialize () {
  var _this = t = this;
  var blocked_images = [];
  var accept_length  = 0;
  var wayixia_images_loading = 0;
  var wayixia_container = Q.$('wayixia-list');
  var wayixia_title_bar = Q.$('wayixia-title-bar');

  
  var wayixia_images_box = new Q.images_box({container: 'wayixia-list', 
    on_item_changed: function(item, check) {
      if(item.style.display == '') { 
        update_ui_count();
      }
    },
    is_item_enabled: function(item) {
      return (item.style.display != 'none');
    }
  });

  var checkbox_show_block = new Q.checkbox({id:'wayixia-show-block',
    onchange: function(checked) {
      wayixia_track_button_click(Q.$('wayixia-show-block'));
      var visible = !checked;
      wayixia_images_box.each_item(function(item) {
        if(Q.hasClass(item, 'blocked')) {
          if(visible) {
            item.style.display = '';
            accept_length++; 
          } else {
            accept_length--; 
            wayixia_images_box.set_check(item, false);
            item.style.display = 'none';
          }
        }
      });

      update_ui_count();
    }
  });

  var button_select_all = new Q.checkbox({id: 'wayixia-select-all',
    onchange: function(checked) {
       wayixia_track_button_click(Q.$('wayixia-select-all'));
      wayixia_images_box.select_all(checked);
    }  
  });

  Q.$('wayixia-add-block').onclick=function() {
    wayixia_track_button_click(this);
    var box = new Q.MessageBox({
      title: locale_text('extName'),
      wstyle: "q-attr-no-icon",
      content: '<div style="margin:auto; padding:20px;font-size:14px;">'+locale_text('infoAddBlock')+'</div>',
      on_ok: function() {
        var remove_items = [];
        var extension = chrome.extension.getBackgroundPage();
        wayixia_images_box.each_item(function(item) {
          if(Q.hasClass(item, 'mouseselected') && item.style.display == '') {
            if(!Q.hasClass(item, 'blocked')) {
              var url = item.getAttribute('data-url');
              extension.block_image_add(url);
              blocked_images.push(url);
	          }
            block_item(item, true);
            accept_length--;
          }
        });

        update_ui_count();
        return true; 
      },
      on_no: function() { return true; },
    });
  }


  Q.$('wayixia-local-download').onclick=function() {
    wayixia_track_button_click(this);
    var extension = chrome.extension.getBackgroundPage();
    wayixia_images_box.each_item(function(item) {
       if((item.className.indexOf('mouseselected') != -1) && item.style.display == '') {
         var url = item.getAttribute('data-url');
         extension.download_image(url);
       }
    });
  }
  
  function block_item(item, blocked) {
    if(blocked) {
      Q.addClass(item, 'blocked');
      item.style.display = 'none';
      wayixia_images_box.set_check(item, false);
    } else {
      Q.removeClass(item, 'blocked');
      item.style.display = '';
    }
  }

  function update_ui_count() {
    Q.$('wayixia-show-block').innerText = locale_text('haveBlocked') + '('+blocked_images.length+')';
    Q.$('wayixia-select-all').innerText = locale_text('selectAll') + '('+accept_length+')';
  }

  function init_block_image_items(blocked_images) {
    return function(item) {
      var is_blocked = false;
      var url = item.getAttribute('data-url');
      for(var i=0; i < blocked_images.length; i++) {
        if(url == blocked_images[i]) {
          block_item(item, true); 
          is_blocked = true;
        }
      }

      if(!is_blocked) {
        accept_length++;
        update_ui_count();
      }
    }
  }

  // entry display images
  this.display_valid_images = function(imgs, data) {
    // init datacheckbox_show_block.checked()
    var accept_images  = {};
    accept_length  = 0;
    blocked_images = [];

    if(!imgs)
      return;
    //filter image duplicated
    for(var i=0; i < imgs.length ; i++) {
      var url = imgs[i].src;
      if(url && (accept_images[url] == undefined) ) {
        var blocked = _this.is_block_image(url);
        accept_images[url] = blocked;
        //accept_length++;
        if(blocked) 
          blocked_images.push(url);
      }
    }
    //accept_length -= blocked_images.length;
    update_ui_count();
    return wayixia_images_box.display_images(accept_images, data, init_block_image_items(blocked_images));
  }

  var g_min_width = 0;
  var g_min_height= 0; 
  var e_width = new Q.slider({id: 'x-ctrl-mini-width', min: 0, max: 100, value: 0, 
    on_xscroll: function(v) {
      g_min_width = v*10;
      wayixia_images_box.each_item(function(item) {
        if(!(checkbox_show_block.checked() && Q.hasClass(item, 'blocked')))
          wayixia_images_box.check_size(item, g_min_width, g_min_height);
      });
      Q.$('wayixia-min-width').innerText = g_min_width + 'px';
    }
  });
  
  var e_height = new Q.slider({id: 'x-ctrl-mini-height', min: 0, max: 100, value: 0, 
    on_xscroll: function(v) { 
      g_min_height = v*10;
      wayixia_images_box.each_item(function(item) {
        if(!(checkbox_show_block.checked() && Q.hasClass(item, 'blocked')))
          wayixia_images_box.check_size(item, g_min_width, g_min_height);
      });
      Q.$('wayixia-min-height').innerText = g_min_height + 'px';
    }
  });
  
  if(request_data.imgs) {
    _this.display_valid_images(request_data.imgs, request_data.data)();
  }

  // shortcut
  Q.addEvent(document, 'keyup', function(evt) {
    var evt = evt || window.event;
    var kcode = evt.which || evt.keyCode;
    if(kcode == 27) {// ESC
      wayixia_track_event('deactive', 'shortcut-ESC');
      deactive();
    }
  });
  
  // test code
  //drag_screen_images_begin();
  content_load_ok = true;
  console.log('content is loaded');
};

function initialize_screenshot() {
  var extension = chrome.extension.getBackgroundPage();
  var e_zoom = new Q.slider({id: 'x-ctrl-screenshot-zoom', min: 25, max: 400, value: 100, 
    on_xscroll: function(v) {
      g_screenshot_zoom = v;
      if(Q.$('wayixia-screenshot-image'))
        Q.$('wayixia-screenshot-image').style.zoom = v/100.0;  
      Q.$('wayixia-screenshot-zoom').innerText = g_screenshot_zoom + '%';
    }
  });
  
  Q.$('wayixia-screenshot-zoom').innerText = e_zoom.get_value() + '%';
  Q.$('wayixia-screenshot-zoom100').onclick = function() { e_zoom.set_value(100); }
  Q.$('wayixia-screenshot-download').onclick = function() {
    wayixia_track_button_click(this);
    if(Q.$('wayixia-screenshot-image')) {
      extension.download_image(Q.$('wayixia-screenshot-image').src);
    }
  }
}

function set_ui(name) {
  if(name == 'screenshot') {
    Q.$('wayixia-toolbar').style.visibility = 'hidden';
    Q.$('wayixia-toolbar-screenshot').style.visibility = 'visible';
  } else {
    Q.$('wayixia-toolbar').style.visibility = 'visible';
    Q.$('wayixia-toolbar-screenshot').style.visibility = 'hidden';
  }
}

function deactive() {
    back2page();
    window.close();
}

Q.Ready(function() {
  document.body.ondragstart  =function() { return false; }
  document.body.onselectstart=function() { return false; }
  Q.set_locale_text(locale_text);
  Q.$('wayixia-title-bar').onclick=function(){ 
    wayixia_track_event('deactive', 'topbar');
    deactive();  
  }
  initialize_screenshot();
  initialize();
  set_ui();
});

function back2page() {
  if(source_tab_id) {
    chrome.tabs.update(source_tab_id, {selected: true});
  }
}


var scroll_loadding = null;
function drag_screen_images_begin() {
  
  // create dialog of screen capture
  g_screenshot_dialog = new Q.Dialog({
    wstyle: "q-attr-no-title|q-attr-progress",
    width: 500, height: 100,
    title: Q.locale_text("extName"),
    content: Q.$('wayixia-progress')
  });
  Q.$('wayixia-progress').style.visibility = "visible";
  g_screenshot_dialog.domodal();
  g_screenshot_dialog.center();
  var w = Q.$("wayixia-progress-bar").offsetWidth;
  scroll_loadding = new Q.slider({id: 'x-ctrl-loadding', min: 0, max: 100, value: 0, 
    on_xscroll: function(v) {
      Q.$("wayixia-progress-bar-thumb").style.width = (v*w/100)+'px';
    }
  });

}

function drag_screen_images_update(n, total) {
  var v = n*scroll_loadding.max*1.0/total;
  console.log("drag_screen_images_update ->" + v);
  scroll_loadding.set_value(v);
}

function drag_screen_images_end() {
  scroll_loadding.set_value(scroll_loadding.max);
  (new Q.Animate({
        tween: 'cubic',
        ease: 'easyin',
        max: 1000,
        begin: 0,
        duration: 100,
        bind : function(x) {
          console.log(x);
          if(x == this.max) {
            g_screenshot_dialog.end_dialog();
          } else {
            g_screenshot_dialog.wnd().style.opacity = ((this.max-x)*1.0) / this.max;
          }
        }
  })).play();
}


/* call background script */

function display_images(tab_id, packet) {
  console.log('display_images called tab_id ->' + tab_id);
  if(packet.track_from) {
    wayixia_track_event("display_images", packet.track_from);
  } else {
    wayixia_track_event("display_images", "from_menu");  
  }
  set_ui('images');
  source_tab_id = tab_id;
  if(content_load_ok) {
    console.log('recv request, content is loaded')
    t.display_valid_images(packet.imgs, packet.data)();
  } else {
    console.log('content is loadding' + packet)
    request_data.imgs = packet.imgs;
    request_data.data = packet.data;
    initialize();
  }
}

function display_full_screenshot(tab_id, canvas_data) {
  wayixia_track_event("display_full_screenshot", "from_menu");  
  set_ui('screenshot');
  source_tab_id = tab_id;
  var wayixia_container = Q.$('wayixia-list');
  var img = document.createElement('img');
  img.id = 'wayixia-screenshot-image';
  wayixia_container.innerHTML = '';
  wayixia_container.appendChild(img);
  merge_images(canvas_data, img);
  Q.drag.attach_object(img, {self: true});
}

function display_screenshot(tab_id, image_data) {
  wayixia_track_event("display_screenshot", "from_menu");  
  set_ui('screenshot');
  source_tab_id = tab_id;
  var wayixia_container = Q.$('wayixia-list');
  var img = document.createElement('img');
  img.id = 'wayixia-screenshot-image';
  wayixia_container.innerHTML = '';
  wayixia_container.appendChild(img);
  img.src = image_data;
  Q.drag.attach_object(img, {self: true});
}

/* call background script end */


function merge_images(canvas_data, image_element) {
  // initialize canvas
  var canvas = document.createElement("canvas");
	canvas.width = canvas_data.size.full_width;
	canvas.height = canvas_data.size.full_height;
  draw_image(canvas, canvas_data, 0, image_element);
}

function draw_image(canvas, canvas_data, n, image_element) {
  var screenshots = canvas_data.screenshots;
  if(n == 0) {
       drag_screen_images_begin();
  }
  drag_screen_images_update(n+1, screenshots.length);
  if(n >= screenshots.length ) {
    // draw completed
    image_element.src = canvas.toDataURL('image/png');
    drag_screen_images_end();
  } else {
    console.log('draw '+n+' image');
    var draw_context = canvas.getContext("2d");
    var s = screenshots[n];
    var row = s.row;
    var col = s.col;
    var x=0, y=0;
    if(row < canvas_data.table.rows-1) {
      y = row*canvas_data.size.page_height;
    } else { // last row
      y = canvas.height - canvas_data.size.page_height; 
    }

    if(col < canvas_data.table.cols-1) {
      x = col*canvas_data.size.page_width;
    } else { // last column
      x = canvas.width - canvas_data.size.page_width; 
    }
    //console.log('x:' + x + ', y=' + y); 
    var memory_image = new Image();
    memory_image.onload =  (function(ctx, m, l, t) { 
      return function() {
        console.log('image load ok');
        ctx.drawImage(m,l,t);
        draw_image(canvas, canvas_data, ++n, image_element);
      }
    })(draw_context, memory_image, x, y);
    memory_image.src = s.data_url;
  }
}

