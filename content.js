/*
 *  wayixia chrome plugin 
 *  
 * */

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
  var links = [].slice.apply(doc.getElementsByTagName('img'));
  links = links.map(function(element) {
    return {src: element.src};
  });
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

var g_scroll_top = 0;
var g_scroll_left = 0;
var g_overflow = '';
var g_page_width = 0;
var g_page_height = 0;
function capture_full_page_start() {
  g_scroll_top  = document.body.scrollTop;
  g_scroll_left = document.body.scrollLeft;
  g_overflow    = document.body.style.overflow;
  document.body.style.overflow='hidden';
  document.body.scrollTop = 0;
  document.body.scrollLeft= 0;
  g_page_width  = document.documentElement.clientWidth;
  g_page_height = document.documentElement.clientHeight;
}

function capture_full_page_stop() {
  document.body.style.overflow = g_overflow;
  document.body.scrollTop = g_scroll_top;
  document.body.scrollLeft= g_scroll_left;
}

function capture_full_page_next() {
  var info = {need_continue: true; };
  info.width = g_page_width;
  info.height = g_page_height;
  
  // 横向最大
  if(document.body.scrollWidth == g_page_width) { // no hr scrollbar
    info.left = 0;
    info.width = g_page_width;
    info.height = g_page_height;
    // 只处理纵向
    if(document.body.scrollHeight <= g_page_height) {
      info.need_continue = false;
      info.top  = 0;
    } else {
      // 纵向滚动条
      if(document.body.scrollTop + g_page_height > document.body.scrollHeight) {
        //已经到底
        info.top = document.body.scrollTop = document.body.scrollHeight - g_page_height;
      } else {
        info.top = document.body.scrollTop = document.body.scrollTop + g_page_height;
      }
    }
  } else {
    if((document.body.scrollLeft+g_page_width) > document.body.scrollWidth) {
      document.body.scrollLeft = document.body.scrollWidth - g_page_width;
    }  
  }
  
  return info;
}

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
  case "capture-full-page":
    sendResponse({full_width: document.body.scrollWidth, full_height: document.body.scrollHeight});
    caputre_full_page_start();
    break; 
  case "capture-next-page":
    sendResponse({leftfull_width: document.body.scrollWidth, full_height: document.body.scrollHeight});
    caputre_full_page_start();
    break; 
  default:
    sendResponse({});
    break;
  }
});
