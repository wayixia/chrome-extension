/*-------------------------------------------------------
 $ file:  wayixia.js
 $ powered by wayixia.com
 $ date: 2014-11-8
 $ author: Q 
---------------------------------------------------------*/

var t = null;

function is_block_image(url) {
  var extension = chrome.extension.getBackgroundPage();
  return extension.is_block_image(url); 
}

function initialize () {
  var _this = t = this;
  var blocked_images = [];
  var accept_length  = 0;
  var extension = chrome.extension.getBackgroundPage();
 
  var wayixia_images_box = new Q.ImagesBox({id: 'wayixia-list', 
    on_item_changed: function(item, check) {
      if(item.style.display == '') { 
        update_ui_count();
      }
    },
    is_item_enabled: function(item) {
      return (item.style.display != 'none');
    },
    on_item_dblclick : function(item) {
      var imgs = [];
      wayixia_images_box.each_item(function(item2) {
        if(item2.style.display == '') {
          imgs.push({
            src: item2.getAttribute('data-url')
          });
        }
      });

      album_player_display(item.getAttribute('data-url'), imgs);
    }
  });

  Q.$('wayixia-view').onclick = function(evt) {return false;}
  var view_type = new Q.DropDownList({ 
    id: 'wayixia-select-view', 
    wstyle: 'wayixia-menu',
    value : extension.view_type(),
    on_change: function(text, value) {
      wayixia_images_box.set_style(value);
      extension.view_type_set(value);
      if(!t.__first_display)
        wayixia_track_button_click(Q.$('wayixia-view'), value);
      t.__first_display = true;
    }  
  });

  var checkbox_show_block = new Q.CheckBox({id:'wayixia-show-block',
    checked: true,
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

  var button_select_all = new Q.CheckBox({id: 'wayixia-select-all',
    onchange: function(checked) {
      wayixia_track_button_click(Q.$('wayixia-select-all'));
      wayixia_images_box.select_all(checked);
    }  
  });

  Q.$('wayixia-add-block').onclick=function() {
    wayixia_track_button_click(this);
    var box = Q.alert({
      title: Q.locale_text('extName'),
      wstyle: "q-attr-no-icon",
      content: '<div style="margin:auto; padding:20px;font-size:14px;">'+Q.locale_text('infoAddBlock')+'</div>',
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
    //Q.$('wayixia-show-block').innerText = Q.locale_text('haveBlocked') + '('+blocked_images.length+')';
    //Q.$('wayixia-select-all').innerText = Q.locale_text('selectAll') + '('+accept_length+')';
    //Q.$('wayixia-select-all').innerText = '('+accept_length+')';
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
    // clear errors
    clear_errors();
    clear_album_player();
    this.e_width.setValue(0);
    this.e_height.setValue(0);
    // init datacheckbox_show_block.checked()
    var accept_images  = {};
    accept_length  = 0;
    blocked_images = [];

    if(!imgs)
      return;
    var filter_rule_is_enabled = extension.filter_rule_is_enabled();
    var filter_rules = extension.filter_rule_get();
    //filter image duplicated
    for(var i=0; i < imgs.length ; i++) {
      var url = imgs[i].src;
      if(filter_rule_is_enabled)
        url = urls_filter(url, filter_rules.rules);
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

  this.g_min_width = 0;
  this.g_min_height= 0; 
  this.e_width = new Q.Slider({id: 'x-ctrl-mini-width', min: 0, max: 100, value: 0, 
    on_xscroll: function(v) {
      g_min_width = v*10;
      wayixia_images_box.each_item(function(item) {
        if(!(checkbox_show_block.checked() && Q.hasClass(item, 'blocked')))
          wayixia_images_box.check_size(item, t.g_min_width, t.g_min_height);
      });
      Q.$('wayixia-min-width').innerText = t.g_min_width + 'px';
    }
  });
  
  this.e_height = new Q.Slider({id: 'x-ctrl-mini-height', min: 0, max: 100, value: 0, 
    on_xscroll: function(v) { 
      t.g_min_height = v*10;
      wayixia_images_box.each_item(function(item) {
        if(!(checkbox_show_block.checked() && Q.hasClass(item, 'blocked')))
          wayixia_images_box.check_size(item, t.g_min_width, t.g_min_height);
      });
      Q.$('wayixia-min-height').innerText = t.g_min_height + 'px';
    }
  });

  /** initialize title of buttons */
  Q.$( 'wayixia-local-download' ).title = Q.locale_text( 'toolSave' );
  Q.$( 'wayixia-select-all' ).title = Q.locale_text( 'selectAll' );
  Q.$( 'wayixia-add-block' ).title = Q.locale_text( 'addBlock' );
  Q.$( 'wayixia-show-block' ).title = Q.locale_text( 'haveBlocked' );
  
  console.log('content is loaded');
};

/** 开放平台接口 */
function api_share2sina(image_src) {
  var json = {
    url: wayixia_request_data.data.pageUrl,
    type:'3',
    count:'1', /**是否显示分享数，1显示(可选)*/
    appkey:'59191755', /**您申请的应用appkey,显示分享来源(可选)*/
    title: wayixia_request_data.data.title, /**分享的文字内容(可选，默认为所在页面的title)*/
    pic: image_src, /**分享图片的路径(可选)*/
    ralateUid:'', /**关联用户的UID，分享微博会@该用户(可选)*/
    language:'zh_cn', /**设置语言，zh_cn|zh_tw(可选)*/
    dpc:1
  }

  window.open("http://service.weibo.com/share/share.php?url=" + json.url + "&appkey=" + json.appkey + "&title=" + json.title + "&pic=" + json.pic + "&ralateUid=" + json.ralateUid + "&language=" + json.language, "_blank", "width=615,height=505")
}

/** 图册播放器 */
var g_album_player = null;

function album_player_display(url, imgs) {
  if(!g_album_player) {
    ui(function(t) {
      var tpl = t.template('album-view');
      document.body.appendChild(tpl);
      g_album_player= new Q.album_player({
        share : function(src) {
          api_share2sina(src); 
        },
        
        download : function(src) {
          var extension = chrome.extension.getBackgroundPage();
          extension.download_image(src, window);
        }
      }); 
      g_album_player.render(url, imgs); 
    }); 
  } else {
    g_album_player.render(url, imgs); 
  }
}

function clear_album_player() {
  if(g_album_player)
    g_album_player.close();
}


/** 挖图界面初始化 */
Q.ready(function() {  
  Q.set_locale_text(locale_text);
  initialize();

  var extension = chrome.extension.getBackgroundPage();
  chrome.tabs.getCurrent( function( tab ) {
    /** initialize images data*/
    var data = extension.get_display_cache(tab.id);
    if( !data )
      return;
    wayixia_source_tab_id = data.ctx_tab_id;
    var packet = data.data || {};
    packet.imgs = packet.imgs || [];
    packet.data = packet.data || {};
    wayixia_request_data.imgs = packet.imgs;
    wayixia_request_data.data = packet.data;
    
    if(wayixia_request_data.imgs) {
      window.display_valid_images(wayixia_request_data.imgs, wayixia_request_data.data)();
    }
  } );
});

