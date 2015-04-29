/*
 *  wayixia chrome plugin 
 *  
 * */

// impliment prototype of currentStyle
var agent   = function() { return navigator.userAgent.toLowerCase(); }
var isW3C   = function() { return document.getElementById ? true:false; }
var isNS6   = function() { return isW3C() && (navigator.appName=="Netscape"); }

//为Firefox下的DOM对象增加innerText属性
if(isNS6()) { //firefox innerText define
  HTMLElement.prototype.__defineGetter__("innerText",    function() { return this.textContent; });
  HTMLElement.prototype.__defineSetter__("innerText",    function(sText) { this.textContent=sText; });
  HTMLElement.prototype.__defineGetter__("currentStyle", function () { return this.ownerDocument.defaultView.getComputedStyle(this, null); });     
}

function get_all_images() {
  var links  = [];
  var docs = [].slice.apply(window.frames);
  docs = docs.map(function(e) {
    return e.document;
  });
  docs.push(document);
  for(var i=0; i < docs.length; i++) {
    var images = get_document_images(docs[i]);
    links = links.concat(images);
  }

  return links;
}

function get_document_images(doc) {
  var imgs = doc.getElementsByTagName('img');
  var links = [].slice.apply(imgs);
  links = links.map(function(element) {
    return {src: urls_filter(element.src)};
  });
  
  var all = document.all;
  for(var i=0; i != all.length; i++) {
    var e = all[i];
    if(e.nodeType == 1) {
      var url = "";
      if(e.currentStyle && e.currentStyle.backgroundImage) {
        url = e.currentStyle.backgroundImage
      } else if(e.style && e.style.backgroundImage) {
        url = e.style.backgroundImage;        
      }
      if(url !="" && /^url\(/.test(url)) {
        url =url.replace(/^url\(/, '').replace(/\)$/, '');       
        url = urls_filter(url);
        links.push({src: url});
      }
    }
  }

  return links;
}

function generate_response(imgs) {
  return {
      type : 'display-images', 
      imgs : imgs,
      data : {
        cookie : document.cookie,  // 用于处理防盗链
        title  : document.title,   // 用于显示默认标题
        pageUrl: location.href     // 用于保存来源地址
      }
  };
}

var g_fullscreen_capture = {
  scroll_top : 0,
  scroll_left : 0,
  overflow : '',
  page_width : 0,
  page_height : 0,

  start : function() {
    this.scroll_top  = document.body.scrollTop;
    this.scroll_left = document.body.scrollLeft;
    this.overflow    = document.body.style.overflow;
    document.body.style.overflow='hidden';
    document.body.scrollTop = 0;
    document.body.scrollLeft= 0;
    this.page_width  = document.documentElement.clientWidth;
    this.page_height = document.documentElement.clientHeight;
  
    return {
      full_width : document.body.scrollWidth, 
      full_height: document.body.scrollHeight, 
      page_width : this.page_width, 
      page_height: this.page_height
    };
  }, 

  capture_page : function(row, col) {
    document.body.scrollTop  = row * this.page_height;
    document.body.scrollLeft = col * this.page_width;
  },

  stop : function() {
    document.body.style.overflow = this.overflow;
    document.body.scrollTop = this.scroll_top;
    document.body.scrollLeft= this.scroll_left;
  }
};

// listener
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) 
{
  switch (request.type) {
  case "display-all-images": 
    sendResponse(generate_response(get_all_images()));
    break;
  case "display-single-image":
    sendResponse(generate_response([{src: request.src}]));    
    break; 
  case "screenshot-begin":
    sendResponse(g_fullscreen_capture.start());
    break; 
  case "screenshot-page":
    g_fullscreen_capture.capture_page(request.row, request.col); 
    sendResponse({});
    break; 
  case "screenshot-end":
    g_fullscreen_capture.stop(); 
    sendResponse({});
    break;
  default:
    sendResponse({});
    break;
  }
});

