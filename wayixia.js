/*-------------------------------------------------------
 $ file:  wayixia.js
 $ powered by wayixia.com
 $ date: 2014-11-8
 $ author: Q 
---------------------------------------------------------*/

var t = null;
var content_load_ok = false;

function initialize () {
  var _this = this;
  var _xdm = null;
  var _login_user = false;
  var wayixia_container = null;

  var wayixia_title_bar = null;
  var wayixia_images_loading = 0;
  t = _this;

  function check_login() {
    console.log('wayixia check login');    
    Q.Ajax({
        command: "http://wayixia.com/?mod=user&action=do-check-login&inajax=true",
        data: {},
        oncomplete: function(xmlhttp) {
          console.log('check login result-> ' + xmlhttp.responseText);
          var resp = Q.json_decode(xmlhttp.responseText);
          _login_user = (resp.data == 1);
        }
    });
  }

  function check_login_dialog() {
    if(!_login_user) {
      // must login
      var wnd = _this.open_window(
        "http://wayixia.com/index.php?mod=user&action=login&logintype=close", 
        { width:580, height:250}
      );

      var timer = setInterval( function() {
         if(wnd.closed) {
           clearInterval(timer);
           check_login();
         }
      }, 1000);
    }

    return _login_user;
  }

  _this.open_window = function(uri, json) {  
    var rc = {
      align: "center",
      left  : 300,
      top    : 200,
      width  : 700,
      height  : 500,
      scrollbars : "yes",
      resizable : "yes",
      statebar : "no"
    };

    json = json || {};
    if(typeof json.width != "undefined") { rc["width"] = json.width; }
    if(typeof json.height != "undefined") { rc["height"] = json.height; }
    if(typeof json.left != "undefined") { rc["left"] = json.left; }
    if(typeof json.top != "undefined") { rc["top"] = json.top; }
    if(typeof json.scrollbars != "undefined") { rc["scrollbars"] = json.scrollbars; }
    if(typeof json.resizable != "undefined") { rc["resizable"] = json.resizable; }
    if(typeof json.scrollbars != "undefined") { rc["statebar"] = json.statebar; }
    if(typeof json.align == "center") {
      rc["left"] = (screen.width  - rc["width"])/2  + 'px';
      rc["top"]  = (screen.height - rc["height"])/2 + 'px';
    }
    
    var wndcfg = []; 
    for(var name in rc) {
      wndcfg.push(name + "=" + rc[name]);
    }
    
    return window.open(uri, "poptempWin", wndcfg.join(","));
  }

  var _state_message = {
    ing: '正在努力地挖...',
    ok : '成功挖到了此图!',
    error: '挖一下，失败!',
    warn: '已经挖过了哦!',
  }

  // state: 
  _this.set_image_state = function(e, state) {
    if(!_state_message[state]) {
      state = 'ing';
    }
    e.className = 'wing_box wing_box_'+state;
    e.state = state;
    e.innerHTML = _state_message[state];
  }

  _this.get_image_state = function(e) {
    var state = e.state || '';
    return state;
  }

  _this.createElement = function(config) {
    var box = document.createElement('DIV');
    wayixia_container.appendChild(box);
    box.setAttribute('data-url', config.src);
    box.setAttribute('data-width', config.width);
    box.setAttribute('data-height', config.height);
    box.className = 'wayixia-box';
    box.innerHTML = '<span class="wayixia-info"> \
      <span class="wh">'+config.width+'x'+config.height+'<span> </span> \
      </span></span>';

    var img = document.createElement('div');
    box.appendChild(img);
    var mask = document.createElement('div');
    mask.className = 'select-mask';
    box.appendChild(mask);

    var a = document.createElement('a');
    img.appendChild(a);
    var inner_img = document.createElement('img');
    var strong_1 = document.createElement('strong');
    var strong_2 = document.createElement('strong');
    a.appendChild(inner_img);
    a.appendChild(strong_1);
    a.appendChild(strong_2);

    img.className = 'wayixia-image';
    a.href='javscript:void(0);';
    a.onclick=function(evt){ evt.preventDefault();};
    inner_img.src=config.src;
    inner_img.className = 'image';
    inner_img.style.cssText = 'margin-top:'+config.margin_top+'px;width:'+config.size_width+'px;height:'+config.size_height+'px;'
    
    strong_1.className = 'qwa';
    strong_1.style.display = 'none';
    strong_2.className = 'wa';
    strong_2.style.display = 'none';

    // wing_box
    var wing_box = document.createElement('DIV');
    box.appendChild(wing_box);
    wing_box.className = 'wing_box';

    
    //box.onmouseover = function() {
    //  strong_1.style.display = 'block';
    //  strong_2.style.display = 'block';  
    //}

    //box.onmouseout = function() {
    //  strong_1.style.display = 'none';
    //  strong_2.style.display = 'none';
    //}
    

    box.onmouseover = function() {
      //if(Q.$('wf-main').className != 'wf-main bat-mode') {
      //  return;
      //}

      if("wayixia-box mouseselected" == this.className) 
        return;
      this.className="wayixia-box mouseover"
    } 
  
    box.onmouseout = function(e) {
      //if(Q.$('wf-main').className != 'wf-main bat-mode') {
      //  return;
      //}
      if("wayixia-box mouseselected" == this.className) 
        return;
      this.className="wayixia-box"
    }

    box.onclick = function() {
      //if(Q.$('wf-main').className != 'wf-main bat-mode') {
      //  return;
      //}
      if("wayixia-box mouseover" != this.className) {
        this.className="wayixia-box";
        //delete g_selected_items[e.data['id']];
        //g_selected_count--;
      } else {
        this.className="wayixia-box mouseselected";
        //g_selected_items[e.data['id']] = e;
        //g_selected_count++;
      }
    }

    strong_1.onclick = function() {
      if(!check_login_dialog()) 
        return;
      //quick wa
      //_this.open_image_window(inner_img.src);
      var json_data = {};
      json_data.pageUrl = config.pageUrl;
      json_data.srcUrl = config.src, 
      json_data.cookie = config.cookie,
      json_data.title = config.title,
      json_data.width = config.width;
      json_data.height = config.height;
      json_data.album_id = 0;
      _this.set_image_state(wing_box, 'ing');
      Q.Ajax({
          command:"http://wayixia.com:8080/getimage",
          data: {img: json_data},
          withCredentials: true,
          noCache:true,
          oncomplete : function(response){
          //wing_box.style.display = 'none';
            var resp = {}; 
            try {
              resp = Q.json_decode(response.responseText);
            } catch(e) {
              resp.header = -1;
              resp.data = e.description;
            }
            var result = resp.header;
            if(result == 0) {
              _this.set_image_state(wing_box, 'ok');
            //alert('恭喜您，成功挖到了您想要的图片!');
            } else if(result == -2) {
              _login_user = false;
              check_login_dialog();
              return;
            } else if(result == -100){
              _this.set_image_state(wing_box, 'warn');
            } else {
              _this.set_image_state(wing_box, 'error');
            //alert('哎呀，挖一下，失败了!('+resp.data+')')
            }
          }, // ok
          onerror: function() {
            _this.set_image_state(wing_box, 'error'); 
          }  // error
      });
    }

    strong_2.onclick = function() { 
      if(!check_login_dialog()) 
        return;
      _this.open_image_window(config);
      deactive();
    }
  }

  _this.each_item = function(callback) {
    var items = wayixia_container.childNodes;
    for(var i=0; i < items.length; i++) {
      var item = items[i];
      if(item.nodeType == Q.ELEMENT_NODE && (!item.id)) {
        callback(item);
      }
    }
 
  }
  _this.select_all = function(selected) {
    var className = (!!selected)?"wayixia-box mouseselected":"wayixia-box";
    _this.each_item(function(item) {
        item.className = className;
    });
  }

  _this.download = function() {
    var extension = chrome.extension.getBackgroundPage();
    var className = "wayixia-box mouseselected";
    _this.each_item(function(item) {
       if(item.className == className && item.style.display == '') {
         var url = item.getAttribute('data-url');
         extension.download_image(url);
       }
    });
  }

  _this.open_image_window = function(image_item) {
    var url = 'http://wayixia.com/?mod=api&action=preview';
    url += '&r='+encodeURIComponent(image_item.pageUrl);
    url += '&c='+encodeURIComponent(image_item.cookie);
    url += '&t='+encodeURIComponent(image_item.title);
    url += '&i='+encodeURIComponent(image_item.src);
    
    _this.open_window(url, {height:355}); 
  }



  //
  // Returns a function which will handle displaying information about the
  // image once the image has finished loading.
  //
  function getImageInfoHandler(data) {
    return function() {
      wayixia_images_loading--;
      var img = this;
      // filter image by size
      var img_width = img.width;
      var img_height = img.height;
      var max_width = 200;
      var max_height = 200;
      var result = max_width * img_height - max_height * img_width;
      var width = 0;
      var height = 0;
      if(result<0) {
        //img.width = max_width;  // 宽度
        width  = max_width;
        height = (max_width*img_height)/(img_width*1.0);
      } else {
        //img.height = max_height;
        height = max_height;
        width  = (img_width*height)/(img_height*1.0);
      }

      var image_item = copy_data(data);        
      image_item['src'] = img.src;
      image_item['width'] = img.width;
      image_item['height'] = img.height;
      image_item['size_width'] = width;
      image_item['size_height'] = height;
      image_item['margin_top'] =  ((max_height-height)/2);
      _this.createElement(image_item);
    };
  };

  _this.displayImages = function(imgs, data) {
    //filter image duplicated
    var accept_images = {};
    for(var i=0; i < imgs.length ; i++) {
      if(imgs[i].src) {
        accept_images[imgs[i].src] = true;
      }
    }

    //console.log(accept_images);
    wayixia_container.innerHTML = '';
    return function() {
      for(var src in accept_images) {
        var img = new Image();
        img.onload=getImageInfoHandler(data);
        img.src=src;
      }
    }
  }

  _this.check_size = function(item, min_width, min_height) {
    var width = item.getAttribute('data-width');
    var height = item.getAttribute('data-height');
    item.style.display = ((width < min_width) || (height < min_height)) ? 'none':'';
  };
    
  wayixia_container = Q.$('wayixia-list');
  wayixia_title_bar = Q.$('wayixia-title-bar');
  Q.$('wayixia-select-all').onclick=function(){ 
    if("checked" == this.className) {
      this.className = "";
      _this.select_all(false);
    } else {
      this.className = "checked";
      _this.select_all(true); 
    }
  }

  Q.$('wayixia-local-download').onclick=function(){ 
    _this.download();
  }
  
  //check_login();
 
  var g_min_width = 0;
  var g_min_height= 0; 
  var e_width = new Q.slider({id: 'x-ctrl-mini-width', min: 0, max: 100, 
    on_xscroll: function(v) {
      g_min_width = v*10;
      _this.each_item(function(item) {
        _this.check_size(item, g_min_width, g_min_height);
      });
      Q.$('wayixia-min-width').innerText = g_min_width + 'px';
    }
  });
  
  var e_height = new Q.slider({id: 'x-ctrl-mini-height', min: 0, max: 100, 
    on_xscroll: function(v) { 
      g_min_height = v*10;
      _this.each_item(function(item) {
        _this.check_size(item, g_min_width, g_min_height);
      });
      Q.$('wayixia-min-height').innerText = g_min_height + 'px';
    }
  });
  if(request_data.imgs) {
    t.displayImages(request_data.imgs, request_data.data)();
  }
  content_load_ok = true;
  console.log('content is loaded');
};

var g_screenshot_zoom = 100;
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

  Q.$('wayixia-screenshot-zoom100').onclick = function() {
    e_zoom.set_value(100);
  }
  
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
});

var source_tab_id = null;
var request_data = {imgs: null, data: null};


function back2page() {
  if(source_tab_id) {
    chrome.tabs.update(source_tab_id, {selected: true});
  }
}

function copy_data(src_object) {
  var target_object = {}; 
  for(var name in src_object) {
    target_object[name] = src_object[name];
  }
  return target_object;
}

/* call background script */

function display_images(tab_id, packet) {
  set_ui('images');
  console.log('displayValidImages called tab_id ->' + tab_id);
  source_tab_id = tab_id;
  if(content_load_ok) {
    console.log('recv request, content is loaded')
    t.displayImages(packet.imgs, packet.data)();
  } else {
    console.log('content is loadding' + packet)
    request_data.imgs = packet.imgs;
    request_data.data = packet.data;
    initialize();
  }
}

function display_full_screenshot(tab_id, canvas_data) {
  set_ui('screenshot');
  console.log(canvas_data);
  var wayixia_container = Q.$('wayixia-list');
  var img = document.createElement('img');
  img.id = 'wayixia-screenshot-image';
  wayixia_container.innerHTML = '';
  wayixia_container.appendChild(img);
  merge_images(canvas_data, img);
}

function display_screenshot(tab_id, image_data) {
  set_ui('screenshot');
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

