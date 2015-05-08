/**
 * 图片展示模块
 * @module album_player
 */

/**
 * 查找parentNode节点是否包含childNode
 * @params {Node} - 父节点
 * @params {Node} - 子节点
 */
function contains(parentNode, childNode) {
    if (parentNode.contains) {
        return parentNode != childNode && parentNode.contains(childNode);
    } else {
        return !!(parentNode.compareDocumentPosition(childNode) & 16);
    }
}

function checkHover(e,target) {
  e = e || window.event;
  if (e.type=="mouseover")  {
    return !contains(target, e.relatedTarget|| e.fromElement) && !((e.relatedTarget||e.fromElement)===target);
  } else {
    return !contains(target, e.relatedTarget|| e.toElement) && !((e.relatedTarget||e.toElement)===target);
  }
}

/** IE浏览器旋转方法 */
function ie_trans(o,d){  
  o.style.fileter=d
}
/** 非IE浏览器旋转方法 */
function notie_trans(o,d){
  o.style.MozTransform = d;
  o.style.webkitTransform = d;
  o.style.msTransform = d;
  o.style.OTransform = d;
  o.style.transform = d;
}

/** 图片顺时针旋转 */
function right_rotate(o){
  if(Q.isIE()){
      var currentFilter = o.currentStyle.filter;
      if (currentFilter){
         var filterMatch = currentFilter.match(/rotation=(\d)+/);
         var r = parseInt(filterMatch[1]) + 1;
         if(r > 3) r = 0;
         ieTrans(o,'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + r + ')');
      }else{
         ieTrans(o,'progid:DXImageTransform.Microsoft.BasicImage(rotation=1)');
      }
   } else { //非IE
      var currentFilter = o.style.MozTransform;
      if (currentFilter) {
         var filterMatch = currentFilter.match(/rotate\(([\-]?\d+)deg\)/);
         var r = parseInt(filterMatch[1]) + 90;
         if (r > 0) r = -270;
         notie_trans(o,'rotate(' + r + 'deg)');
      }else{
        //如果o.style.MozTransform不存在，就说明这是第一次旋转，也就是右转90度，-270
        notie_trans(o,'rotate(-270deg)');
       }
    }
}

/** 恢复默认方向 */
function reset_rotate(o) {
  if(Q.isIE()) {
    delete o.style.filter;
   } else { 
    var d = 'rotate(0deg)';
    o.style.MozTransform = d;
    o.style.webkitTransform = d;
    o.style.msTransform = d;
    o.style.OTransform = d;
    o.style.transform = d;
  } 
}

/**
 * album player
 * @constructor 
 */

Q.album_player = Q.extend({
  hwnd: null,
  display: false,
  image_list : null,
  image_view : null,
  image_selected: null,
  width: 0,
  old_overflow: null,
  old_scrolltop: 0,
  album_id: 0,
  current_image_id : 0,
  current_image_url : 0,
  images_data : null,
  album_list_api: null,
  __init__ : function(config) {
    config = config || {};
    this.album_list_api = config.album_list_api;
    // main view
    this.hwnd = Q.$('album-view');
    this.image_container = Q.$('image-container');
    this.image_view = Q.$('image-view');
    this.image_list_container = Q.$('image-list-container');
    this.image_list = Q.$('image-list');
    this.images_data = {};
    // init draging objects 
    Q.drag.attach_object(this.image_view, {self: true});
     
    // init data
    this.width = this.hwnd.offsetWidth;
    this.height= this.hwnd.offsetHeight;
    this.move(this.width);
    this.image_view.onload = Q.bind_handler(this, function() { this.image_ok(); });
    this.image_view.onerror= Q.bind_handler(this, function() { this.image_error(); });
    Q.$('image-next').onclick= Q.bind_handler(this, function() { this.image_next(); });
    Q.$('image-prev').onclick= Q.bind_handler(this, function() { this.image_prev(); });
    Q.$('album-close-button').onclick= Q.bind_handler(this, function() { this.close(); });
    Q.$('toolbar-restore').onclick   = Q.bind_handler(this, function() { this.image_view.style.zoom = 1});
    Q.$('toolbar-direction').onclick = Q.bind_handler(this, function() { right_rotate(this.image_view); });
    Q.$('toolbar-favorite').onclick  = Q.bind_handler(this, function() { 
        var o = Q.$('toolbar-favorite');
        var add = (o.className != "checked");
        api_image_favorite(this.current_image_id, add?"add":"remove", function(ok) {
          o.className=(ok && add)?"checked":"";
        });
    });
    Q.$('toolbar-share').onclick      = Q.bind_handler(this, function() { api_share2sina(this.current_image_url)});
    Q.addEvent(window, 'resize', Q.bind_handler(this, this.on_resize));
    Q.addEvent(this.image_container, 'mousewheel', Q.bind_handler(this, this.on_mousewheel));
    Q.addEvent(document, 'keyup', Q.bind_handler(this, this.on_keyup));
    Q.addEvent(this.image_container, 'mouseover', Q.bind_handler(this, this.on_mouseover));
    Q.addEvent(this.image_container, 'mouseout', Q.bind_handler(this, this.on_mouseout));
  },

  on_resize : function() {  
    this.width = this.hwnd.offsetWidth;
    this.height= this.hwnd.offsetHeight;
    if(!this.display) {
      this.move(this.width);
    } 
  },

  on_mousewheel : function(evt) {
    var evt = evt || window.event;
    //Q.printf(evt.wheelDeltaY);
    // 获取对象缩放比例， 并转化成十进制整数
    Q.printf(this.image_view.currentStyle.zoom);
    var zoom = parseInt(this.image_view.currentStyle.zoom*100,10);
    //滚轮移动量上移+120， 下移-120
    zoom+=evt.wheelDelta/12;
    if(zoom>0)
      this.image_view.style.zoom = zoom/100.0;  //重新设置比例
    //this.on_resize(); 
    Q.$('toolbar-restore').disabled = (zoom == 1);
  },
 
  on_keyup : function(evt) {
    evt = evt || window.event;
    var kcode = evt.which || evt.keyCode;
    console.log(kcode + '->' + String.fromCharCode(kcode));
    if(kcode === 39) {
      this.image_next();
    } else if(kcode === 37) {
      this.image_prev();
    } else if(kcode === 27) {
      this.close();
    }
  },

  on_mouseover : function(e) {
    var _this = this;
    if(!checkHover(e, this.image_container))
      return;
    
    (new Q.Animate({
        tween: 'cubic',
        ease: 'easyin',
        max: 800,
        begin: 0,
        duration: 25,
        bind : function(x) {
         Q.$('image-next').style.opacity = x / 1000.0;
         Q.$('image-prev').style.opacity = x / 1000.0;
        }
    })).play();
  },

  on_mouseout : function(e) {
    var _this = this;
    if(!checkHover(e, this.image_container))
      return;
    
    (new Q.Animate({
        tween: 'cubic',
        ease: 'easyin',
        max: 1000,
        begin: 0,
        duration: 25,
        bind : function(x) {
          Q.$('image-next').style.opacity = (1000-x) / 1000.0;
          Q.$('image-prev').style.opacity = (1000-x) / 1000.0;
        }
      })).play();
  },

  image_ok : function() {
    //Q.printf("width: "+this.image_view.width + ", height: " + this.image_view.height)          
    var pos_left = -(this.image_view.width - this.image_container.offsetWidth)/2;
    var pos_top  = -(this.image_view.height - (this.image_container.offsetHeight-this.image_list_container.offsetHeight))/2;
    this.image_view.style.left = pos_left + 'px';
    this.image_view.style.top = pos_top + 'px';
    Q.$('image-loadding').style.visibility = 'hidden';
  },

  image_error : function() {
    Q.$('image-loadding').style.visibility = 'hidden';
  },

  render : function(url, id, album_id) {
    var _this = this;
    if(this.image_view.src ==  url)
      return;
    this.current_image_id = id;
    this.current_image_url = url;
    this.image_view.style.zoom = 1; 
    this.image_view.src = url;
    reset_rotate(this.image_view);
    Q.$('image-loadding').style.visibility = 'visible';
    if(!_this.display) {
      _this.display = true;
      _this.hwnd.style.visibility = 'visible';
      _this.move(_this.width);
      _this.load_album_images(album_id, id);
      (new Q.Animate({
        tween: 'cubic',
        ease: 'easyin',
        max: _this.width,
        begin: 0,
        duration: 25,
        bind : function(x) {
          _this.move(_this.width-x);
        }
      })).play();
    } else {
      _this.select_album_item(id);
    }
  },

  update_image_info : function(id) {
    var img = this.images_data[id];
    if(!img)
      return;
    var update_size = new Image();
    
    update_size.onload = function() {
      //Q.printf(this.width+":"+this.height);
      Q.$('image-title').innerText = "标题: " + img.title;
      Q.$('image-title').title = img.title;
      Q.$('image-url').title = this.src;
      Q.$('image-url').innerText = "地址: " + this.src;
      Q.$('image-size').innerText= "大小: " + this.width + " x " + this.height + " pixels";
    }
    update_size.src = 'http://'+img.server+'/'+img.file_name;       
  },

  close : function() {
    var _this = this;
    _this.display = !_this.display;
    _this.move(_this.width);
    (new Q.Animate({
      tween: 'Cubic',
      ease: 'easyIn',
      max: _this.width,
      begin: 0,
      duration: 25,
      bind : function(x) {
        _this.move(x);
        if(x >= _this.width) {
          _this.image_view.src = '';
        }
      }
    })).play();
  },

  onclose : function() {
  
  },
  
  move : function(x) {
    this.hwnd.style.left  = x + 'px';
    this.hwnd.style.right = -x + 'px'
  },

  load_album_images : function(album_id, id) {
    var _this = this;
    if(_this.album_id == album_id) {
       _this.select_album_item(id);
    } else {
      _this.album_id = album_id;
      Q.Ajax({
        //command: "http://wayixia.com/?mod=api&action=album-image-list&inajax=true&id="+album_id,    
        command: _this.album_list_api +''+album_id,    
        oncomplete: function(xmlhttp) {
          _this.render_album_list(xmlhttp.responseText);
          _this.select_album_item(id);
        }
      });
    } 
  },

  render_album_list : function(json_string) {
    var _this = this;
    var res = Q.json_decode(json_string);
    var images = res.data.images;
    var tpl = res.data.tpl;
    
    for(var i=0; i < images.length; i++) {
      _this.create_item_with_template(this.image_list, images[i], tpl);
    }
  },

  create_item_with_template : function(container, item, tpl) {
    var _this = this;
    var pre_width = 192;
    tpl = tpl.replace(/\[\[(\w+)\]\]/ig, 
      function(w,w2,w3,w4) {
        if(w2 == 'width') {
          return pre_width;
        } else if(w2=='height') {
          return (item.height * pre_width) / (item.width*1.0); 
        }
       
        if(_this.item_callback) {
          return _this.item_callback(w2, item);
        }
        return item[w2];
      }
    );
    container.innerHTML += tpl;
    _this.images_data[item.id] = item;
  },

  select_album_item : function(id) {
    this.update_image_info(id);
    //console.log("album list scrollWidth == offsetWidth: " + this.image_list.scrollWidth + ', ' +this.image_list.offsetWidth);

    var item = Q.$('album-item-'+id);
    if(item == this.image_selected)
      return;

    if(this.image_selected) 
      this.image_selected.className = "item";
    
    this.image_selected = item;
    item.className = 'item selected';
    // load image info
    this.load_image_info();

    if(this.image_list_container.scrollWidth > this.image_list_container.offsetWidth) {
      var _this = this;
      var scroll_left = _this.image_list_container.scrollLeft;
      var width = (item.offsetLeft-scroll_left) - (this.image_list_container.offsetWidth-item.offsetWidth)/2;
      // scroll view
      (new Q.Animate({
        tween: 'Cubic',
        ease: 'easyIn',
        max: width,
        begin: 0,
        duration: 25,
        bind : function(x) {
          _this.image_list_container.scrollLeft = scroll_left + x;
        }
      })).play();
    }
  },

  load_image_info : function(id) {
                      
  },

  image_next : function() {
    var item = null;
    if(!this.image_selected) {
      item = _this.image_list_container.firstChild;
    } else if(!this.image_selected.nextElementSibling) {
      return;
    } else {
      item = this.image_selected.nextElementSibling;
    }
    
    item.click();
    //if(!re.test(item.id))
    //  return;
    //this.select_album_item(RegExp.$1);
  },

  image_prev : function() {
    var item = null;
    if(!this.image_selected) {
      item = _this.image_list_container.firstChild;
    } else if(!this.image_selected.previousElementSibling) {
      return;
    } else {
      item = this.image_selected.previousElementSibling;
    }
    
    item.click();
  }
});

