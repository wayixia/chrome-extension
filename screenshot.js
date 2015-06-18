/**
 * @file:  screenshot.js
 * @powered by wayixia.com
 * @date: 2014-11-8
 * @author: Q 
 */

var content_load_ok = false;
var g_screenshot_zoom = 100;
var g_screenshot_dialog = null;
var g_canvas_editor = null;

function initialize () {
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

/** 简易的调色板，固定给出几组颜色
 *
 * @constructor
 * @param {Object} json - 构造参数
*/
Q.ColorTable = Q.DropWindow.extend({
  table : null,
  __init__ : function(json) {
    
    json = json || {};
    json.width = ( 12+3 )*16+2;
    json.height= ( 12+2 )*14+2;
    if( typeof json.onchange == "function" ) 
      this.onchange = json.onchange;
    
    /** color table */
    var defaultColors = [
      '990033', 'ff3366', 'cc0033', 'ff0033', 'ff9999', 'cc3366', 'ffccff', 'cc6699',
      '993366', '660033', 'cc3399', 'ff99cc', 'ff66cc', 'ff99ff', 'ff6699', 'cc0066',
      'ff0066', 'ff3399', 'ff0099', 'ff33cc', 'ff00cc', 'ff66ff', 'ff33ff', 'ff00ff',
      'cc0099', '990066', 'cc66cc', 'cc33cc', 'cc99ff', 'cc66ff', 'cc33ff', '993399',
      'cc00cc', 'cc00ff', '9900cc', '990099', 'cc99cc', '996699', '663366', '660099',
      '9933cc', '660066', '9900ff', '9933ff', '9966cc', '330033', '663399', '6633cc',
      '6600cc', '9966ff', '330066', '6600ff', '6633ff', 'ccccff', '9999ff', '9999cc',
      '6666cc', '6666ff', '666699', '333366', '333399', '330099', '3300cc', '3300ff',
      '3333ff', '3333cc', '0066ff', '0033ff', '3366ff', '3366cc', '000066', '000033',
      '0000ff', '000099', '0033cc', '0000cc', '336699', '0066cc', '99ccff', '6699ff',
      '003366', '6699cc', '006699', '3399cc', '0099cc', '66ccff', '3399ff', '003399',
      '0099ff', '33ccff', '00ccff', '99ffff', '66ffff', '33ffff', '00ffff', '00cccc',
      '009999', '669999', '99cccc', 'ccffff', '33cccc', '66cccc', '339999', '336666',
      '006666', '003333', '00ffcc', '33ffcc', '33cc99', '00cc99', '66ffcc', '99ffcc',
      '00ff99', '339966', '006633', '336633', '669966', '66cc66', '99ff99', '66ff66',
      '339933', '99cc99', '66ff99', '33ff99', '33cc66', '00cc66', '66cc99', '009966',
      '009933', '33ff66', '00ff66', 'ccffcc', 'ccff99', '99ff66', '99ff33', '00ff33',
      '33ff33', '00cc33', '33cc33', '66ff33', '00ff00', '66cc33', '006600', '003300',
      '009900', '33ff00', '66ff00', '99ff00', '66cc00', '00cc00', '33cc00', '339900',
      '99cc66', '669933', '99cc33', '336600', '669900', '99cc00', 'ccff66', 'ccff33',
      'ccff00', '999900', 'cccc00', 'cccc33', '333300', '666600', '999933', 'cccc66',
      '666633', '999966', 'cccc99', 'ffffcc', 'ffff99', 'ffff66', 'ffff33', 'ffff00',
      'ffcc00', 'ffcc66', 'ffcc33', 'cc9933', '996600', 'cc9900', 'ff9900', 'cc6600',
      '993300', 'cc6633', '663300', 'ff9966', 'ff6633', 'ff9933', 'ff6600', 'cc3300',
      '996633', '330000', '663333', '996666', 'cc9999', '993333', 'cc6666', 'ffcccc',
      'ff3333', 'cc3333', 'ff6666', '660000', '990000', 'cc0000', 'ff0000', 'ff3300',
      'cc9966', 'ffcc99', 'ffffff', 'cccccc', '999999', '666666', '333333', '000000',
      '000000', '000000', '000000', '000000', '000000', '000000', '000000', '000000'
    ];
    
    /** init color table */
    this.table = document.createElement('table');
    var current_row = null;
    for(var i=0; i < defaultColors.length; i++) {
      if(i % 16 == 0) {
        current_row = this.table.insertRow(-1);
      }

      var td = current_row.insertCell(-1);
      td.style.width = "12px";
      td.style.height = "12px";
      td.style.backgroundColor = "#" + defaultColors[i];
      td.onclick = ( function(t, o) { return function( evt ) {
        t.onchange && t.onchange(o.style.backgroundColor);
        t.hide();
      } } )(this, td);
    }

    json.content = this.table;
    Q.DropWindow.prototype.__init__.call(this, json);
  }
});

/** line width window
 *
 */
Q.WidthSelector = Q.DropWindow.extend( {
__init__ : function( json ) {
  json = json || {};

  var line_width = [1, 2, 3, 4, 5];
  this.table = document.createElement('table');
  this.table.width = "100%";
  this.table.cellPadding = 3;
  this.table.cellSpacing = 0;
  for(var i=0; i < line_width.length; i++) {
    var row = this.table.insertRow(-1);
    var td1 = row.insertCell(-1);
    var td2 = row.insertCell(-1);
    var hr = document.createElement('hr');
    hr.style.height = line_width[i];
    hr.style.backgroundColor = "#515151";
    hr.style.borderWidth = 0;
    row.onclick = (function( t, e ) { return function() {
      if(t.onchange)
        t.onchange( parseInt(e.style.height, 10) );
      t.hide();
    } })(this, hr);
    row.onmouseover = function(evt) { 
      this.style.backgroundColor = "#EEE"; 
    }
    row.onmouseout = function(evt) { 
      this.style.backgroundColor = "transparent";
    }
    td1.style.width = "120"
    td1.appendChild(hr);
    td2.style.width = "30";
    td2.innerText = line_width[i] + "px";
  }
  
  if( typeof json.onchange == "function" )
    this.onchange = json.onchange;

  json.content = this.table;
  json.width = 122;
  json.height = 140;
  Q.DropWindow.prototype.__init__.call(this, json);
}

} );


/** font size drop window
 *
 */
Q.FontSizeSelector = Q.DropWindow.extend( {
__init__ : function( json ) {
  json = json || {};

  var line_width = [14, 16, 22, 28, 40];
  this.table = document.createElement('table');
  this.table.width = "100%";
  this.table.cellPadding = 3;
  this.table.cellSpacing = 0;
  for(var i=0; i < line_width.length; i++) {
    var row = this.table.insertRow(-1);
    var td1 = row.insertCell(-1);
    var td2 = row.insertCell(-1);
    td1.style.fontSize = line_width[i] + 'px';
    td1.innerText = "FontSize"
    row.onclick = (function( t, e ) { return function() {
      if(t.onchange)
        t.onchange( parseInt(e.style.fontSize, 10) );
      t.hide();
    } })(this, td1);
    row.onmouseover = function(evt) { 
      this.style.backgroundColor = "#EEE"; 
    }
    row.onmouseout = function(evt) { 
      this.style.backgroundColor = "transparent";
    }
    td1.style.width = "120"
    td2.style.width = "30";
    td2.innerText = line_width[i] + "px";
  }
  
  if( typeof json.onchange == "function" )
    this.onchange = json.onchange;

  json.content = this.table;
  json.width = 122;
  json.height = 200;
  Q.DropWindow.prototype.__init__.call(this, json);
}

} );



/** an editor of Canvas
 *
 * @constructor
 * @param json {Object} - constructor argument 
 */
Q.CanvasEditor = Q.extend({
canvas  : null,
context : null,
font_size : 16,
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
  this.initToolbar();
},

initToolbar : function() {
  var _this = this;
  /**
   * colorTable
   */
  this.colorTable = new Q.ColorTable( { onchange : function( color ) {
    Q.$( 'wayixia-screenshot-color-view' ).style.backgroundColor = color;
    _this.context.strokeStyle = _this.contextI.strokeStyle = color;
    _this.context.fillStyle = _this.contextI.fillStyle = color;
  } } );
    
  Q.$( 'wayixia-screenshot-color' ).onclick = (function(t, e) { return function(evt) { 
    t.colorTable.showElement(e);
  } } )(this, Q.$( 'wayixia-screenshot-color' ));

  /**
   * widthSelector
   */
  this.widthSelector = new Q.WidthSelector( { onchange: function(width) { 
    _this.context.lineWidth = _this.contextI.lineWidth = width;
    Q.$( 'wayixia-screenshot-line-width' ).style.height = width + 'px';
    Q.$( 'wayixia-screenshot-line-text' ).innerText = width + 'px';
  } } );
  
  Q.$( 'wayixia-screenshot-size' ).onclick = (function(t, e) { return function(evt) { 
    t.widthSelector.showElement(e);
  } } )(this, Q.$( 'wayixia-screenshot-size' ));

  this.fontsizeSelector = new Q.FontSizeSelector( { onchange: function( fontsize ) {
    _this.font_size = fontsize;
    Q.$( 'wayixia-screenshot-fontsize' ).innerText = fontsize + 'px';
  } } );
  
  Q.$( 'wayixia-screenshot-fontsize' ).onclick = (function(t, e) { return function(evt) { 
    t.fontsizeSelector.showElement(e);
  } } )(this, Q.$( 'wayixia-screenshot-fontsize' ));
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

  this.context.strokeStyle = this.contextI.strokeStyle = 
  this.context.fillStyle = this.contextI.fillStyle = "#FF0033";
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
  
  if(a == 0 || b == 0)
    return;
  
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
  context.stroke();
  context.closePath();
  context.restore();
},

drawArrow: function(pntFrom, pntTo, context) {


  var color="#ffff00";
  var rotation=0;
  context.save();
  var arrowShape = [
    [-16, -8],
    [-16, 8],
    [6, 0],
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
  context.restore();
},

wrapText : function(context, text, x, y, maxWidth, lineHeight) {
  var cars = text.split("\n");
  for (var ii = 0; ii < cars.length; ii++) {
   var line = "";
   var words = cars[ii].split(" ");
   for (var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + " ";
    var metrics = context.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth) {
     context.fillText(line, x, y);
     line = words[n] + " ";
     y += lineHeight;
    }
    else {
     line = testLine;
    }
   }
   context.fillText(line, x, y);
   y += lineHeight;
  }
},

getIntValue : function(s) {
  return parseInt(s.replace("px", ""), 10);
},

drawText : function(pntFrom, pntTo, context) {
  //this.drawRectangle(pntFrom, pntTo, context);
  var ta = document.createElement('textarea');
  var left = pntFrom.x;
  var top = pntFrom.y;
  if(pntTo.x < pntFrom.x) {
    left = pntTo.x;
  }

  if(pntTo.y < pntFrom.y) {
    top = pntTo.y;
  }

  left += this.canvas.offsetLeft;
  top  += this.canvas.offsetTop;
  var width = Math.abs(pntTo.x-pntFrom.x);
  var height = Math.abs(pntTo.y-pntFrom.y);
  ta.style.cssText = "overflow: hidden;position:absolute; background-color: transparent; "
    + "font-size: " + this.font_size + "px; line-height: " + (this.font_size+2) + "px; " 
    + "border: 0px solid red; left:"+left+"px; top:"+top+";px; color: "+ this.context.fillStyle +"; width:"+width+"px; height:"+height+";";
  this.canvas.parentNode.appendChild(ta);
  ta.focus();
  ta.onblur = (function(t, a) { return function() {
    var line_height = t.getIntValue(a.currentStyle.lineHeight);
    var textCanvasCtx = t.context;
    textCanvasCtx.font = a.currentStyle.fontSize +" " + a.currentStyle.fontFamily;
    Q.printf(textCanvasCtx.font);
    textCanvasCtx.fillStyle = a.currentStyle.color;
    textCanvasCtx.strokeStyle = a.currentStyle.color; //"rgba(0,255,0,0.8)";
    //textCanvasCtx.textBaseline = 'bottom';//设置文本的垂直对齐方式  top|hanging|middle|alphabetic|ideographic|bottom
    textCanvasCtx.textAlign = 'left'; //设置文本的水平对对齐方式
    a.style.display = "none";
    var text = a.value + '';
    var text_left = left+t.getIntValue(a.currentStyle.paddingLeft)+t.getIntValue(a.currentStyle.borderLeftWidth) - 15;
    var text_right = left+width-(t.getIntValue(a.currentStyle.paddingRight)+t.getIntValue(a.currentStyle.borderRightWidth)) - 15;
    var tt = top+t.getIntValue(a.currentStyle.paddingTop) +t.getIntValue(a.currentStyle.borderTopWidth)+t.getIntValue(a.currentStyle.marginTop);
    var line = "";
    var line_width = 0;
    for(var i=0; i<text.length; i++) {
      var px = textCanvasCtx.measureText(text[i]);
      line_width += px.width;
      if( line_width > (text_right-text_left) || ( text[i] == "\n" ) ) {
        textCanvasCtx.fillText(line, text_left, tt);
        tt += line_height;
        if( text[i] != "\n" )
          i--;
        line = "";
        line_width = 0;
      } else {
        line += text[i];
      }
    }
    textCanvasCtx.fillText( line, text_left, tt );
    //a.style.display = "none";
    //a.parentNode.removeChild(a);
  }})(this, ta);
},

_MouseDown : function(evt) {
  evt = evt || window.event;
  // 屏蔽右键拖动
  if(evt.button == Q.RBUTTON) 
    return; 
  var target_wnd = drag_handle = this.nn6 ? evt.target : evt.srcElement; // 获取鼠标悬停所在的对象句柄

  if(target_wnd && (target_wnd == this.canvas_interface)) {
      var scrollInfo = { l: this.container.scrollLeft, t: this.container.scrollTop}; //Q.scrollInfo(); 
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
    } else if(this.action == "rect" || this.action == "text") {
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
      } else if(this.action == "text") {
        this.drawText(pointFrom, pointTo, this.context);
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
  //display_screenshot(0, "http://s1.wayixia.com/007022b0-c338-4e92-b460-e47421d34f70", "http://wayixia.com");
  //display_screenshot(0, "http://tgi1.jia.com/104/839/4839808.jpg", "http://wayixia.com");
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
  scroll_loadding.setValue(v);
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
  merge_images(canvas_data);
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
    wayixia_canvas.width = this.width; 
    wayixia_canvas.height= this.height; 
    var draw_context = wayixia_canvas.getContext("2d");
    draw_context.drawImage(this, 0, 0);

    drag_screen_images_end();
    var imgData = draw_context.getImageData(0,0, wayixia_canvas.width, wayixia_canvas.height);
    draw_context.putImageData(imgData,0,0);
    // init painter
    g_canvas_editor = new Q.CanvasEditor({
      id : Q.$('wayixia-canvas'),
      container: Q.$('wayixia-container')
    });
  };
  img.src = image_data;
}

/* call background script end */

function merge_images(canvas_data) {
  // initialize canvas
  var canvas = Q.$('wayixia-canvas'); //  document.createElement("canvas");
	canvas.width = canvas_data.size.full_width;
	canvas.height = canvas_data.size.full_height;
 
  draw_image(canvas, canvas_data, 0);
}

function draw_image(canvas, canvas_data, n) {
  var screenshots = canvas_data.screenshots;
  if(n == 0) {
       drag_screen_images_begin();
  }
  drag_screen_images_update(n+1, screenshots.length);
  if(n >= screenshots.length ) {
    // draw completed
    //image_element.src = canvas.toDataURL('image/png');
    drag_screen_images_end();
    g_canvas_editor = new Q.CanvasEditor({
      id : canvas,
      container: Q.$( 'wayixia-container' )
    });
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
        draw_image(canvas, canvas_data, ++n);
      }
    })(draw_context, memory_image, x, y);
    memory_image.src = s.data_url;
  }
}

