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
  
  var cols = Math.ceil(document.body.scrollWidth*1.0 / g_page_width);
  var rows = Math.ceil(document.body.scrollHeight*1.0 / g_page_height);
  console.log("cols: " + cols + ", rows: " + rows);
 
  return {rows: rows, cols: cols}; 
}

function capture_full_page_stop() {
  //document.body.style.overflow = g_overflow;
  //document.body.scrollTop = g_scroll_top;
  //document.body.scrollLeft= g_scroll_left;
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
    sendResponse(capture_full_page_start());
    break; 
  case "capture-page":
    document.body.scrollTop = request.rows*g_page_height;
    document.body.scrollLeft = request.cols*g_page_width;
    sendResponse({});
    break; 
  case "capture-page-stop":
    capture_full_page_stop();
    sendResponse({});
    break;
  default:
    sendResponse({});
    break;
  }
});
