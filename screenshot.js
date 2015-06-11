/**
 * @file:  screenshot.js
 * @powered by wayixia.com
 * @date: 2014-11-8
 * @author: Q 
 */

var t = null;
var content_load_ok = false;
var g_screenshot_zoom = 100;
var g_screenshot_dialog = null;
var g_canvas_editor = null;

function initialize () {
  var _this = t = this;
  var extension = chrome.extension.getBackgroundPage();
 
  var e_zoom = new Q.Slider({id: 'x-ctrl-screenshot-zoom', min: 25, max: 400, value: 100, 
    on_xscroll: function(v) {
      g_screenshot_zoom = v;
      if(g_canvas_editor)
        g_canvas_editor.zoom(v); ///100.0;  
      Q.$('wayixia-screenshot-zoomtext').innerText = g_screenshot_zoom + '%';
    }
  });
  
  Q.$('wayixia-screenshot-zoomtext').innerText = e_zoom.getValue() + '%';
  Q.$('wayixia-screenshot-zoom100').onclick = function() { e_zoom.setValue(100); }
  Q.$('wayixia-screenshot-download').onclick = function() {
    wayixia_track_button_click(this);
    //if(Q.$('wayixia-screenshot-image')) {
      extension.download_image(Q.$('wayixia-canvas').toDataURL('image/png'));
    //}
  }
 
  content_load_ok = true;
}

function fireMouseEvent(element, evtName) {
  if( document.createEvent ) 
  {
     var evObj = document.createEvent('MouseEvents');
     evObj.initEvent( evtName, true, false );
     element.dispatchEvent(evObj);
  }
  else if( document.createEventObject )
  {
      element.fireEvent('on'+evtName);
  }
}


Q.canvas_editor = Q.extend({
canvas  : null,
context : null,
is_drag : false,
x : 0,
y : 0,
container: null,
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
  this.container = Q.$(config.container);
 
  // init toolbar
  var toolbars = {};
  var  toolbars_onchange = (function(t) { return function(checked) {
    if(checked) {
      for(var name in toolbars) {
        if(toolbars[name] != this) {
          toolbars[name].setCheck(false);
        } else {
          t.action = name;
        } 
      } 
    } 
  }})(this);

  toolbars["text"] = new Q.CheckBox({id: "wayixia-screenshot-text", onchange: toolbars_onchange});
  toolbars["arrow"] = new Q.CheckBox({id: "wayixia-screenshot-arrow", onchange: toolbars_onchange});
  toolbars["rect"] = new Q.CheckBox({id: "wayixia-screenshot-rect", onchange: toolbars_onchange});
  toolbars["eclipse"] = new Q.CheckBox({id: "wayixia-screenshot-eclipse", onchange: toolbars_onchange});
  toolbars["line"] = new Q.CheckBox({id: "wayixia-screenshot-line", onchange: toolbars_onchange});
  toolbars["zoom"] = new Q.CheckBox({id: "wayixia-screenshot-zoom", onchange: toolbars_onchange});
  
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

zoom : function(v) {
  this.canvas.style.zoom = v/100.0;
  this.canvas_interface.style.zoom = v/100.0;
},

zoomxy : function(pnt) {
  if(this.canvas.style.zoom) {
    var z = parseFloat(this.canvas.style.zoom);
    return {x: parseInt(pnt.x*1.0 / z, 10), y: parseInt(pnt.y*1.0/z, 10)}
  } else {
    return pnt;
  }
},

drawRectangle: function(pntFrom, pntTo, context) {
		context.beginPath();
		context.strokeRect(pntFrom.x, pntFrom.y, pntTo.x - pntFrom.x, pntTo.y - pntFrom.y);
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

drawEclipse : function(pntFrom, pntTo, context) {
  var x = pntFrom.x;
  var y = pntFrom.y;
  var a = Math.abs(pntTo.x-pntFrom.x)/2;
  var b = Math.abs(pntTo.y-pntFrom.y)/2;
  if(pntTo.x < pntFrom.x) {
    x = pntTo.x;
  }
  if(pntTo.x < pntFrom.x) {
    y = pntTo.y;
  }

  context.save();
  //选择a、b中的较大者作为arc方法的半径参数
  var r = (a > b) ? a : b; 
  var ratioX = a / r; //横轴缩放比率
  var ratioY = b / r; //纵轴缩放比率
  context.scale(ratioX, ratioY); //进行缩放（均匀压缩）
  context.beginPath();
  //从椭圆的左端点开始逆时针绘制
  context.moveTo((x + a) / ratioX, y / ratioY);
  context.arc(x / ratioX, y / ratioY, r, 0, 2 * Math.PI);
  context.restore();
  context.stroke();
  context.closePath();
},

drawArrow: function(pntFrom, pntTo, context) {


  var color="#ffff00";
  var rotation=0;
  context.save();
  /*
  context.translate(pntTo.x, pntTo.y);
  context.rotate(rotation);
  context.lineWidth=2;
  context.fillStyle=color;
  context.beginPath();
  context.moveTo(-50,-25);
  context.lineTo(0,-25);
  context.lineTo(0,-50);
  context.lineTo(50,0);
  context.lineTo(0,50);
  context.lineTo(0,25);
  context.lineTo(-50,25);
  context.lineTo(-50,-25);
  context.closePath();
  context.stroke();
  */
  var arrowShape = [
    [-8, -5],
    [-8, 5],
    [2, 0],
  ];
  
// Functions from blog tutorial
	function drawFilledPolygon(canvas,shape)/*{{{*/
	{
		canvas.beginPath();
		canvas.moveTo(shape[0][0],shape[0][1]);

		for(p in shape)
			if (p > 0) canvas.lineTo(shape[p][0],shape[p][1]);

		canvas.lineTo(shape[0][0],shape[0][1]);
		canvas.fill();
	};
	/*}}}*/
	function translateShape(shape,x,y)/*{{{*/
	{
		var rv = [];
		for(p in shape)
			rv.push([ shape[p][0] + x, shape[p][1] + y ]);
		return rv;
	};
	/*}}}*/
	function rotateShape(shape,ang)/*{{{*/
	{
		var rv = [];
		for(p in shape)
			rv.push(rotatePoint(ang,shape[p][0],shape[p][1]));
		return rv;
	};
	/*}}}*/
	function rotatePoint(ang,x,y)/*{{{*/
	{
		return [
			(x * Math.cos(ang)) - (y * Math.sin(ang)),
			(x * Math.sin(ang)) + (y * Math.cos(ang))
		];
	};

  context.beginPath();
  context.moveTo(pntFrom.x, pntFrom.y);  // p2
  context.lineTo(pntTo.x, pntTo.y);  // p2
  context.closePath();
  context.stroke();
  
  var ang = Math.atan2(pntTo.y-pntFrom.y, pntTo.x-pntFrom.x);
	drawFilledPolygon(context,translateShape(rotateShape(arrowShape,ang),pntTo.x, pntTo.y));
  var arrowShape2 = [
    [2, 0],
    [-8, -4],
    [-8, 4]
  ]
	//drawFilledPolygon(context,translateShape(rotateShape(arrowShape2,ang),pntFrom.x, pntFrom.y));
  context.restore();
},

_MouseDown : function(evt) {
  evt = evt || window.event;
  // 屏蔽右键拖动
  if(evt.button == Q.RBUTTON) 
    return; 
  var target_wnd = drag_handle = this.nn6 ? evt.target : evt.srcElement; // 获取鼠标悬停所在的对象句柄

  if(target_wnd && (target_wnd == this.canvas_interface)) {
      var scrollInfo = { l: this.container.scrollLeft, t: this.container.scrollTop}; //Q.scrollInfo(); 
    //fireMouseEvent(document, "mousedown");
      this.is_drag = true; 
      this.x = scrollInfo.l+evt.clientX;
      this.y = scrollInfo.t+evt.clientY; 
      
      // 添加MouseMove事件
      this.tmr = setTimeout((function(t) { return function() { 
        Q.addEvent(document, 'mousemove', t.MouseMove_Handler);  
      }})(this), 100);

      this.pos = Q.absPosition(this.canvas);
      return true; 
  }
},
    
_MouseMove : function(evt){
  this.is_moved = true;
  evt = evt || window.event
  if (this.is_drag) {
    //var x = evt.clientX-_this.x;
    //var y = evt.clientY-_this.y;
    //if(_this.hCaptureWnd.style.zoom) {
    //  _this.hCaptureWnd.on_move(_this.begin_left+(x/_this.hCaptureWnd.style.zoom), _this.begin_top+(y/_this.hCaptureWnd.style.zoom));
    //} else {
    //  _this.hCaptureWnd.on_move(_this.begin_left+x, _this.begin_top+y);
    //}
    var scrollInfo = { l: this.container.scrollLeft, t: this.container.scrollTop};
    this.contextI.clearRect(0, 0, this.canvas_interface.offsetWidth, this.canvas_interface.offsetHeight);
    var pointFrom = {};
    pointFrom.x = this.x-this.pos.left+0.5;
    pointFrom.y = this.y-this.pos.top+0.5;
    var pointTo = {};
    pointTo.x = evt.clientX+scrollInfo.l-this.pos.left+0.5;
    pointTo.y = evt.clientY+scrollInfo.t-this.pos.top+0.5;
    
    pointFrom = this.zoomxy(pointFrom);
    pointTo = this.zoomxy(pointTo);

    console.log(pointFrom)
    console.log(pointTo)
    if(this.action == "line") {
      this.drawLine(pointFrom, pointTo, this.contextI);
    } else if(this.action == "rect") {
      this.drawRectangle(pointFrom, pointTo, this.contextI);
    } else if(this.action == "eclipse") {
      this.drawEclipse(pointFrom, pointTo, this.contextI);
    } else if(this.action == "arrow") {
      this.drawArrow(pointFrom, pointTo, this.contextI);
    }
  }
},

_MouseUp : function(evt) {
    clearTimeout(this.tmr);
    if(this.is_drag ) {
      var scrollInfo = { l: this.container.scrollLeft, t: this.container.scrollTop}; //Q.scrollInfo(); 
      this.is_drag=false;
      Q.removeEvent(document,'mousemove', this.MouseMove_Handler);
      Q.printf("end: x -> " + evt.clientX + ", y -> " + evt.clientY);
      var pointFrom = {};
      pointFrom.x = this.x-this.pos.left+0.5;
      pointFrom.y = this.y-this.pos.top+0.5;
      var pointTo = {};
      pointTo.x = scrollInfo.l+evt.clientX-this.pos.left+0.5;
      pointTo.y = scrollInfo.t+evt.clientY-this.pos.top+0.5;
      
      pointFrom = this.zoomxy(pointFrom);
      pointTo = this.zoomxy(pointTo);
      if(this.action == "line") {
        this.drawLine(pointFrom, pointTo, this.context);
      } else if(this.action == "rect") {
        this.drawRectangle(pointFrom, pointTo, this.context);
      } else if(this.action == "eclipse") {
        this.drawEclipse(pointFrom, pointTo, this.context);
      } else if(this.action == "arrow") {
        this.drawArrow(pointFrom, pointTo, this.context);
      }
      this.contextI.clearRect(0, 0, this.canvas_interface.offsetWidth, this.canvas_interface.offsetHeight);
    }
    this.is_moved=false;
}
});

Q.ready(function() {
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
  scroll_loadding = new Q.Slider({id: 'x-ctrl-loadding', min: 0, max: 100, value: 0, 
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
  scroll_loadding.setValue(scroll_loadding.max);
  (new Q.Animate({ tween: 'cubic', ease: 'easyin',
        max: 1000, begin: 0, duration: 100,
        bind : function(x) {
          if(x == this.max) {
            g_screenshot_dialog.end();
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
    g_canvas_editor = new Q.canvas_editor({
      id : Q.$('wayixia-canvas'),
      container: Q.$('wayixia-container')
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

