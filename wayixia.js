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

function is_block_image(url) {
  var extension = chrome.extension.getBackgroundPage();
  return extension.is_block_image(url); 
}

function initialize () {
  var _this = t = this;
  var blocked_images = [];
  var wayixia_images_loading = 0;
  var wayixia_container = Q.$('wayixia-list');
  var wayixia_title_bar = Q.$('wayixia-title-bar');
  this.images_box = new Q.images_box({container: 'wayixia-list'});

  Q.addEvent(document, 'keyup', function(evt) {
    var evt = evt || window.event;
    var kcode = evt.which || evt.keyCode;
    if(kcode == 27) // ESC
      deactive();
  })
  Q.$('wayixia-show-block').onclick=function(){ 
    var block_display = '';
    if(this.className.indexOf('checked') != -1) {
      Q.removeClass(this, "checked");
      block_display = "";
    } else {
      Q.addClass(this, "checked");
      block_display = "none";
    }
    
    _this.images_box.each_item(function(item) {
      if(item.className.indexOf('blocked') != -1) {
        item.style.display = block_display; 
      }
    });
  }

  Q.$('wayixia-select-all').onclick=function(){ 
    if("checked" == this.className) {
      this.className = "";
      _this.images_box.select_all(false);
    } else {
      this.className = "checked";
      _this.images_box.select_all(true); 
    }
  }

  Q.$('wayixia-local-download').onclick=function() { 
    var extension = chrome.extension.getBackgroundPage();
    _this.images_box.each_item(function(item) {
       if((item.className.indexOf('mouseselected') != -1) && item.style.display == '') {
         var url = item.getAttribute('data-url');
         extension.download_image(url);
       }
    });
  }
 
  Q.$('wayixia-add-block').onclick=function() {
    var box = new Q.MessageBox({
      title: '挖一下',
      content: '<div style="margin:auto; padding:20px;font-size:14px;">屏蔽后将不再显示, 确定要屏蔽选中图片吗?</div>',
      on_ok: function() {
        var remove_items = [];
        var extension = chrome.extension.getBackgroundPage();
        _this.images_box.each_item(function(item) {
          if((item.className.indexOf('mouseselected') != -1) && item.style.display == '') {
            var url = item.getAttribute('data-url');
            extension.block_image_add(url);
            Q.addClass(item, 'blocked');
            item.style.display = 'none';
            blocked_images.push(url);
          }
        });
        Q.$('wayixia-show-block').innerText = '已屏蔽('+blocked_images.length+')';

        return true; 
      },
      on_no: function() { return true; },
    });
  } 

  function block_image_item(blocked_images) {
    return function(item) {
      var url = item.getAttribute('data-url');
      for(var i=0; i < blocked_images.length; i++) {
        if(url == blocked_images[i]) {
          Q.addClass(item, 'blocked');
          item.style.display = 'none';
        }
      }
    }
  }

  this.display_valid_images = function(imgs, data) {
    //filter image duplicated
    var accept_images  = {};
    blocked_images = [];
    for(var i=0; i < imgs.length ; i++) {
      if(imgs[i].src) {
        var blocked = _this.is_block_image(imgs[i].src);
        accept_images[imgs[i].src] = blocked;
        if(blocked)  
          blocked_images.push(imgs[i].src);
      }
    }
    Q.$('wayixia-show-block').innerText = '已屏蔽('+blocked_images.length+')';
    
    return t.images_box.display_images(accept_images, data, block_image_item(blocked_images));
  }

  var g_min_width = 0;
  var g_min_height= 0; 
  var e_width = new Q.slider({id: 'x-ctrl-mini-width', min: 0, max: 100, value: 0, 
    on_xscroll: function(v) {
      g_min_width = v*10;
      _this.images_box.each_item(function(item) {
        _this.images_box.check_size(item, g_min_width, g_min_height);
      });
      Q.$('wayixia-min-width').innerText = g_min_width + 'px';
    }
  });
  
  var e_height = new Q.slider({id: 'x-ctrl-mini-height', min: 0, max: 100, value: 0, 
    on_xscroll: function(v) { 
      g_min_height = v*10;
      _this.images_box.each_item(function(item) {
        _this.images_box.check_size(item, g_min_width, g_min_height);
      });
      Q.$('wayixia-min-height').innerText = g_min_height + 'px';
    }
  });
  
  if(request_data.imgs) {
    _this.display_valid_images(request_data.imgs, request_data.data)();
  }

  content_load_ok = true;
  console.log('content is loaded');
};

function initialize_screenshot() {
  var extension = chrome.extension.getBackgroundPage();
  var e_zoom = new Q.slider({id: 'x-ctrl-screenshot-zoom', min: 25, max: 400, value: 100, 
    on_xscroll: function(v) {
      g_screenshot_zoom = v;
      if(Q.$('wayixia-screenshot-image'))
        Q.$('wayixia-screenshot-image').style.zoom = v/100.0;  //重新设置比例
      Q.$('wayixia-screenshot-zoom').innerText = g_screenshot_zoom + '%';
    }
  });
  
  Q.$('wayixia-screenshot-zoom').innerText = e_zoom.get_value() + '%';
  Q.$('wayixia-screenshot-zoom100').onclick = function() { e_zoom.set_value(100); }
  Q.$('wayixia-screenshot-download').onclick = function() {
    if(Q.$('wayixia-screenshot-image')) {
      extension.download_image(Q.$('wayixia-screenshot-image').src);
    }
  }
}

function set_ui(name) {
  if(name == 'screenshot') {
    Q.$('wayixia-toolbar').style.display = 'none';
    Q.$('wayixia-toolbar-screenshot').style.display = '';
  } else {
    Q.$('wayixia-toolbar').style.display = '';
    Q.$('wayixia-toolbar-screenshot').style.display = 'none';
  }
}

function deactive() {
    back2page();
    window.close();
}

Q.Ready(function() {
  document.body.ondragstart  =function() { return false; }
  document.body.onselectstart=function() { return false; }
  Q.$('wayixia-title-bar').onmouseover=function() { this.style.background='#FF9900';}
  Q.$('wayixia-title-bar').onmouseout=function() { this.style.background='#2d2d2d';}
  Q.$('wayixia-title-bar').onmousedown=function() { this.style.background='#FF6600';}
  Q.$('wayixia-title-bar').onclick=function(){ deactive();  }
  initialize_screenshot();
  initialize();
  set_ui();
});

function back2page() {
  if(source_tab_id) {
    chrome.tabs.update(source_tab_id, {selected: true});
  }
}


/* call background script */

function display_images(tab_id, packet) {
  console.log('display_images called tab_id ->' + tab_id);
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
  set_ui('screenshot');
  source_tab_id = tab_id;
  var wayixia_container = Q.$('wayixia-list');
  var img = document.createElement('img');
  img.id = 'wayixia-screenshot-image';
  wayixia_container.innerHTML = '';
  wayixia_container.appendChild(img);
  merge_images(canvas_data, img);
}

function display_screenshot(tab_id, image_data) {
  set_ui('screenshot');
  source_tab_id = tab_id;
  var wayixia_container = Q.$('wayixia-list');
  var img = document.createElement('img');
  img.id = 'wayixia-screenshot-image';
  wayixia_container.innerHTML = '';
  wayixia_container.appendChild(img);
  img.src = image_data;
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
  if(n >= screenshots.length ) {
    // draw completed
    image_element.src = canvas.toDataURL('image/png');
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
    console.log('x:' + x + ', y=' + y); 
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

