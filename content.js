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
  default:
    sendResponse({});
    break;
  }
});
