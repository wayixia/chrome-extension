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
    if(Q.$('wayixia-screenshot-image')) {
      extension.download_image(Q.$('wayixia-screenshot-image').src);
    }
  }
  
  content_load_ok = true;
}

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

