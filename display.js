/*-------------------------------------------------------
 $ file:  wayixia.js
 $ powered by wayixia.com
 $ date: 2014-11-8
 $ author: Q 
---------------------------------------------------------*/

var t = null;
var content_load_ok = false;

function is_block_image(url) {
  var extension = chrome.extension.getBackgroundPage();
  return extension.is_block_image(url); 
}

function initialize () {
  var _this = t = this;
  var blocked_images = [];
  var accept_length  = 0;
  var extension = chrome.extension.getBackgroundPage();
 
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

  Q.$('wayixia-view').onclick = function(evt) {return false;}
  var view_type = new Q.dropdownlist({ 
    render: 'wayixia-select-view', 
    wstyle: 'wayixia-menu',
    on_change: function(text, value) {
      console.log("set view type -> " + value);
      wayixia_images_box.set_style(value);
      extension.view_type_set(value);
    }  
  });

  
  view_type.set_value(extension.view_type());
  wayixia_images_box.set_style(extension.view_type());

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
    wayixia_images_box.each_item(function(item) {
      download_item(item);
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

  function download_item(item) {
    if((item.className.indexOf('mouseselected') != -1) && item.style.display == '') {
      var extension = chrome.extension.getBackgroundPage();
      var url = item.getAttribute('data-url');
      extension.download_image(url, window);
      Q.addClass(item, 'downloaded');
      item.style.display = 'none';
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
  
  if(wayixia_request_data.imgs) {
    _this.display_valid_images(wayixia_request_data.imgs, wayixia_request_data.data)();
  }

  console.log('content is loaded');
};

Q.Ready(function() {
  //document.body.oncontextmenu=function() { return false; }
  Q.set_locale_text(locale_text);
  initialize();
  content_load_ok = true;
});

/* call background script */

function display_images(tab_id, packet) {
  console.log('display_images called tab_id ->' + tab_id);
  if(packet.track_from) {
    wayixia_track_event("display_images", packet.track_from);
  } else {
    wayixia_track_event("display_images", "from_menu");  
  }
  wayixia_source_tab_id = tab_id;
  wayixia_request_data.imgs = packet.imgs;
  wayixia_request_data.data = packet.data;
  if(content_load_ok) {
    console.log('recv request, content is loaded')
    t.display_valid_images(packet.imgs, packet.data)();
  } else {
    console.log('content is loadding' + packet)
    initialize();
  }
}

/* call background script end */
