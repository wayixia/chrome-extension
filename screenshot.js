/*-------------------------------------------------------
 $ file:  wayixia.js
 $ powered by wayixia.com
 $ date: 2014-11-8
 $ author: Q 
---------------------------------------------------------*/

var t = null;
var content_load_ok = false;
var g_screenshot_zoom = 100;
var g_screenshot_dialog = null;

function initialize () {
  var _this = t = this;
  var extension = chrome.extension.getBackgroundPage();
 
  var e_zoom = new Q.slider({id: 'x-ctrl-screenshot-zoom', min: 25, max: 400, value: 100, 
    on_xscroll: function(v) {
      g_screenshot_zoom = v;
      if(Q.$('wayixia-canvas'))
        Q.$('wayixia-canvas').style.zoom = v/100.0;  
      //if(Q.$('wayixia-screenshot-image'))
      //  Q.$('wayixia-screenshot-image').style.zoom = v/100.0;  
      Q.$('wayixia-screenshot-zoom').innerText = g_screenshot_zoom + '%';
    }
  });
  
  Q.$('wayixia-screenshot-zoom').innerText = e_zoom.get_value() + '%';
  Q.$('wayixia-screenshot-zoom100').onclick = function() { e_zoom.set_value(100); }
  Q.$('wayixia-screenshot-download').onclick = function() {
    wayixia_track_button_click(this);
    //if(Q.$('wayixia-screenshot-image')) {
      extension.download_image(Q.$('wayixia-canvas').toDataURL('image/png'));
    //}
  }
 
  content_load_ok = true;
}

Q.canvas_editor = Q.extend({
canvas  : null,
context : null,
is_drag : false,
x : 0,
y : 0,
MouseDown_Hanlder : null,
MouseUp_Handler : null,
MouseMove_Handler : null,
is_moved : false,
tmr : null,
__init__ : function(config) {
  config = config || {};
  this.canvas = config.id;
  this.context = this.canvas.getContext('2d');
  this.pos = Q.absPosition(this.canvas);
  // rect
  this.rectangle = document.createElement('div');
  this.rectangle.style.cssText = "position:absolute; border: 1px solid #000;";
  document.body.appendChild(this.rectangle);
  
  var current_brush = "";
  // init toolbar
  var toolbars = {};
  function toolbars_onchange(checked) {
    if(checked) {
      for(var name in toolbars) {
        if(toolbars[name] != this) {
          toolbars[name].set_checked(false);
        } else {
          current_brush = name;
        } 
      } 
    }
  }

  toolbars["text"] = new Q.checkbox({id: "wayixia-screenshot-text", onchange: toolbars_onchange});
  toolbars["arrow"] = new Q.checkbox({id: "wayixia-screenshot-arrow", onchange: toolbars_onchange});
  toolbars["rect"] = new Q.checkbox({id: "wayixia-screenshot-rect", onchange: toolbars_onchange});
  toolbars["eclipse"] = new Q.checkbox({id: "wayixia-screenshot-eclipse", onchange: toolbars_onchange});
  toolbars["line"] = new Q.checkbox({id: "wayixia-screenshot-line", onchange: toolbars_onchange});
  toolbars["zoom"] = new Q.checkbox({id: "wayixia-screenshot-zoom", onchange: toolbars_onchange});
  
  this.createInterface();

  // 缓存时间
  this.MouseDown_Hanlder = (function(t) { return function(evt) { 
    t._MouseDown(evt); 
  }})(this);
  this.MouseUp_Handler   = (function(t) { return function(evt) { 
    t._MouseUp(evt); 
  }})(this);
  this.MouseMove_Handler = (function(t) { return function(evt) { 
    t._MouseMove(evt); 
  }})(this);
 
  Q.addEvent(document, 'mousedown', this.MouseDown_Hanlder);
  Q.addEvent(document, 'mouseup', this.MouseUp_Handler);
},

createInterface : function() {
  // create interface canvas
  this.canvas_interface = this.canvas.cloneNode(true);
  this.canvas.parentNode.appendChild(this.canvas_interface);
  this.canvas_interface.style.cssText = "position: absolute; left: " + this.canvas.offsetLeft +
    "; top: " + this.canvas.offsetTop + 
    "; width: " + this.canvas.offsetWidth + 
    "; height: " + this.canvas.offsetHeight + 
    ";";
  this.contextI = this.canvas_interface.getContext('2d');
},

drawRectangle: function(pntFrom, pntTo, context) {
		context.beginPath();
		context.fillRect(pntFrom.x, pntFrom.y, pntTo.x - pntFrom.x, pntTo.y - pntFrom.y);
		context.closePath();
},

drawCircle: function (pntFrom, pntTo, context) {
  var centerX = Math.max(pntFrom.x,pntTo.x) - Math.abs(pntFrom.x - pntTo.x)/2;
	var centerY = Math.max(pntFrom.y,pntTo.y) - Math.abs(pntFrom.y - pntTo.y)/2;
	context.beginPath();
	var distance = Math.sqrt(Math.pow(pntFrom.x - pntTo.x,2) + Math.pow(pntFrom.y - pntTo.y,2));
	context.arc(centerX, centerY, distance/2,0,Math.PI*2 ,true);
	context.fill();
	context.closePath();
},

drawLine: function(pntFrom, pntTo, context) {
  console.log(pntFrom.x + ', ' + pntFrom.y + '; ' + pntTo.x + ', ' + pntTo.y);
  context.beginPath();
	context.moveTo(pntFrom.x,pntFrom.y);
	context.lineTo(pntTo.x,pntTo.y);
	context.stroke();
	context.closePath();
},


_MouseDown : function(evt) {
  evt = evt || window.event;
  // 屏蔽右键拖动
  if(evt.button == Q.RBUTTON) 
    return; 
  var target_wnd = drag_handle = this.nn6 ? evt.target : evt.srcElement; // 获取鼠标悬停所在的对象句柄

  if(target_wnd && (target_wnd == this.canvas_interface)) {
      this.is_drag = true; 
      this.x = evt.clientX;
      this.y = evt.clientY; 
      
      // 添加MouseMove事件
      this.tmr = setTimeout((function(t) { return function() { 
        Q.addEvent(document, 'mousemove', t.MouseMove_Handler);  
      }})(this), 100);

      this.pos = Q.absPosition(this.canvas);
      /*
      this.context.beginPath();
      this.context.moveTo(this.x-this.pos.left, this.y-this.pos.top);
      
      //this.rectangle.style.display = '';
      this.rectangle.style.left = this.x + 'px';
      this.rectangle.style.top = this.y + 'px';
      this.rectangle.style.width = 0;
      this.rectangle.style.height = 0;
      Q.printf("begin: x -> " + this.x + ", y -> " + this.y);
      //this.contextI.lineJoin = "round";
      //this.contextI.lineWidth = 1; 
      */
      return false; 
    }
},
    
_MouseMove : function(evt){
    var _this = this;
    _this.is_moved = true;
    evt = evt || window.event
    if (_this.is_drag) {
      //var x = evt.clientX-_this.x;
      //var y = evt.clientY-_this.y;
      //if(_this.hCaptureWnd.style.zoom) {
      //  _this.hCaptureWnd.on_move(_this.begin_left+(x/_this.hCaptureWnd.style.zoom), _this.begin_top+(y/_this.hCaptureWnd.style.zoom));
      //} else {
      //  _this.hCaptureWnd.on_move(_this.begin_left+x, _this.begin_top+y);
      //}
      
      /*
      var width = evt.clientX-this.x;
      var height = evt.clientY-this.y;
      if(width < 0) {
        this.rectangle.style.right = (document.body.scrollWidth-this.x) + 'px';
        this.rectangle.style.left = evt.clientX;
      } else {
        this.rectangle.style.left = this.x + 'px';
      }
      if(height < 0) {
        this.rectangle.style.bottom = (document.body.scrollHeight-this.y) + 'px';
        this.rectangle.style.top = evt.clientY;
      } else {
        this.rectangle.style.top = this.y + 'px';
      }
      this.rectangle.style.width = Math.abs(width) + 'px';
      this.rectangle.style.height = Math.abs(height) + 'px';
      
     // Q.printf("move: x -> " + evt.clientX + ", y -> " + evt.clientY);
     */
      this.contextI.clearRect(0, 0, this.canvas_interface.offsetWidth, this.canvas_interface.offsetHeight);
      var pointFrom = {};
      pointFrom.x = this.x-this.pos.left+0.5;
      pointFrom.y = this.y-this.pos.top+0.5;
      var pointTo = {};
      pointTo.x = evt.clientX-this.pos.left+0.5;
      pointTo.y = evt.clientY-this.pos.top+0.5; 
      this.drawLine(pointFrom, pointTo, this.contextI);
    
      return false; 
    }
},

_MouseUp : function(evt) {
    clearTimeout(this.tmr);
    if(this.is_drag ) {
      this.is_drag=false;
      Q.removeEvent(document,'mousemove', this.MouseMove_Handler);
      Q.printf("end: x -> " + evt.clientX + ", y -> " + evt.clientY);
      var pointFrom = {};
      pointFrom.x = this.x-this.pos.left+0.5;
      pointFrom.y = this.y-this.pos.top+0.5;
      var pointTo = {};
      pointTo.x = evt.clientX-this.pos.left+0.5;
      pointTo.y = evt.clientY-this.pos.top+0.5; 
      this.drawLine(pointFrom, pointTo, this.context);

    }
    this.is_moved=false;
    this.rectangle.style.display = 'none';
}
});

Q.Ready(function() {
  Q.set_locale_text(locale_text);
  initialize();
  // debug code
  display_screenshot(0, "http://s1.wayixia.com/007022b0-c338-4e92-b460-e47421d34f70", "http://wayixia.com");
});


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
  (new Q.Animate({ tween: 'cubic', ease: 'easyin',
        max: 1000, begin: 0, duration: 100,
        bind : function(x) {
          if(x == this.max) {
            g_screenshot_dialog.end_dialog();
          } else {
            g_screenshot_dialog.wnd().style.opacity = ((this.max-x)*1.0) / this.max;
          }
        }
  })).play();
}


function display_full_screenshot(tab_id, canvas_data, url) {
  wayixia_track_event("display_full_screenshot", "from_menu");  
  wayixia_source_tab_id = tab_id;
  wayixia_request_data.data.pageUrl = url;
  var wayixia_container = Q.$('wayixia-list');
  var img = document.createElement('img');
  img.id = 'wayixia-screenshot-image';
  wayixia_container.innerHTML = '';
  wayixia_container.appendChild(img);
  merge_images(canvas_data, img);
  Q.drag.attach_object(img, {self: true});
}

function display_screenshot(tab_id, image_data, url) {
  wayixia_track_event("display_screenshot", "from_menu");  
  wayixia_source_tab_id = tab_id;
  wayixia_request_data.data.pageUrl = url;
  drag_screen_images_begin();
  var wayixia_canvas = Q.$('wayixia-canvas');
  //wayixia_container.innerHTML = '';
  
  //var img = document.createElement('img');
  //img.id = 'wayixia-screenshot-image';
  //wayixia_container.appendChild(img);
  var img = new Image();
  img.onerror = function() {  drag_screen_images_end(); };
  img.onload  = function() {
    wayixia_canvas.width = this.width+10; 
    wayixia_canvas.height= this.height+10; 
    var draw_context = wayixia_canvas.getContext("2d");
    draw_context.drawImage(this, 0, 0);

    drag_screen_images_end();
    var imgData = draw_context.getImageData(0,0, wayixia_canvas.width, wayixia_canvas.height);
    wayixia_canvas.width = 1000;
    draw_context.putImageData(imgData,0,0);
    // init painter
    new Q.canvas_editor({
      id : Q.$('wayixia-canvas')
    });
  };
  img.src = image_data;
  //Q.drag.attach_object(img, {self: true});
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

