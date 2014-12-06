/*-------------------------------------------------------
 $ file:  images_box.js
 $ powered by wayixia.com
 $ date: 2014-12-09
 $ author: Q 
---------------------------------------------------------*/

Q.images_box = Q.extend({
hwnd: null,
__init__ : function(config) {
  config = config || {};
  this.hwnd = Q.$(config.container);
},

create_element: function(config, init) {
  var box = document.createElement('DIV');
  box.setAttribute('data-url', config.src);
  box.setAttribute('data-width', config.width);
  box.setAttribute('data-height', config.height);
  box.className = 'wayixia-box';
  box.innerHTML = '<span class="wayixia-info"> \
    <span class="wh">'+config.width+'x'+config.height+'<span> </span> \
    </span></span>';

  this.hwnd.appendChild(box);
  var img = document.createElement('div');
  box.appendChild(img);
  var mask = document.createElement('div');
  mask.className = 'select-mask';
  box.appendChild(mask);

  var a = document.createElement('a');
  img.appendChild(a);
  var inner_img = document.createElement('img');
  a.appendChild(inner_img);

  img.className = 'wayixia-image';
  a.href='javscript:void(0);';
  a.onclick=function(evt){ evt.preventDefault();};
  inner_img.src=config.src;
  inner_img.className = 'image';
  inner_img.style.cssText = 'margin-top:'+config.margin_top+'px;width:'+config.size_width+'px;height:'+config.size_height+'px;'

  box.onmouseover = function() {
    if("wayixia-box mouseselected" == this.className) 
      return;
    this.className="wayixia-box mouseover"
  } 
  
  box.onmouseout = function(e) {
    if("wayixia-box mouseselected" == this.className) 
      return;
    this.className="wayixia-box"
  }

  box.onclick = function() {
    if("wayixia-box mouseover" != this.className) {
      this.className="wayixia-box";
    } else {
      this.className="wayixia-box mouseselected";
    }
  }

  init(box);
},

each_item : function(callback) {
  var items = this.hwnd.childNodes;
  for(var i=0; i < items.length; i++) {
    var item = items[i];
    if(item.nodeType == Q.ELEMENT_NODE && (!item.id)) {
      callback(item);
    }
  }
 
},

select_all : function(selected) {
  var className = (!!selected)?"wayixia-box mouseselected":"wayixia-box";
  this.each_item(function(item) {
      item.className = className;
  });
},

//
// Returns a function which will handle displaying information about the
// image once the image has finished loading.
//
getImageInfoHandler : function(data, init) {
  var _this = this;
  return function() {
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

    var image_item = _this.copy_data(data);        
    image_item['src'] = img.src;
    image_item['width'] = img.width;
    image_item['height'] = img.height;
    image_item['size_width'] = width;
    image_item['size_height'] = height;
    image_item['margin_top'] =  ((max_height-height)/2);
    _this.create_element(image_item, init);
  };
},

display_images : function(accept_images, data, init) {
  var _this = this;
  init = init || function(item) {}
  this.hwnd.innerHTML = '';
  return function() {
    for(var src in accept_images) {
        var img = new Image();
        img.onload=_this.getImageInfoHandler(data, init);
        img.src=src;
    }
  }
},

check_size : function(item, min_width, min_height) {
  var width = item.getAttribute('data-width');
  var height = item.getAttribute('data-height');
  item.style.display = ((width < min_width) || (height < min_height)) ? 'none':'';

},

copy_data : function(src_object) {
  var target_object = {}; 
  for(var name in src_object) {
    target_object[name] = src_object[name];
  }
  return target_object;
},

}); // Q.images_box

