
var g_option_window = null;
var g_about_window = null;
var g_block_window = null;
var g_block_images_box = null;
function init_about() {
  g_about_window = new Q.MessageBox({
    title: '关于插件',
    width: 500,
    height: 300, 
    content: Q.$('layer-about'),
    on_close: function() {window.close();},
    on_ok: function() {window.close();}
  });

  Q.$('layer-about').style.visibility = 'visible';
  Q.$('layer-about-version').innerText = '版本: v' + chrome.runtime.getManifest().version;
}

function init() {
  Q.$('save_path').value = g_config.save_path;
  g_option_window = new Q.Dialog({
    title: '选项',
    content: Q.$('layer'),
    on_close: function() { window.close(); },
    buttons : [
      { text: '保 存', onclick: function() { 
         g_config.save_path = Q.$('save_path').value;
         g_config.save();
         new Q.MessageBox({title: '挖一下', content: '<div style="margin:auto; padding:20px;font-size:14px;">设置保存成功!</div>'});
         return false;
        }
      },
      { text: '取 消', style: 'syscancelbtn', onclick: function() { return true; }          },
    ]  
  });
  Q.$('layer').style.visibility = 'visible';
  g_option_window.domodal($GetDesktopWindow());

  // block images
  Q.$('manager_block_images').onclick = function() {
    g_block_images_box = new Q.images_box({container: 'wayixia-list'});
    
    var extension = chrome.extension.getBackgroundPage();
    var block_images = extension.block_images_all();
    g_block_images_box.display_images(block_images, {})();  
    display_block_images();
  } 
}

function display_block_images() {
  
  g_block_window = new Q.Dialog({
    parent: g_option_window,
    width: 800,
    height: 600,
    title: '已屏蔽图片',
    content: Q.$('layer-block-images'),
    buttons: [
      { text: '取消屏蔽', onclick: function() { block_images_remove(); return false; }  },
      { text: '关 闭', style:'syscancelbtn', onclick: function() { return true; } 
      },
    ]
  });
  Q.$('layer-block-images').style.visibility = 'visible';
  g_block_window.domodal();
}

function block_images_remove() {
  var extension = chrome.extension.getBackgroundPage();
  var remove_items = [];
  g_block_images_box.each_item(function(item) {
    if(item.className == "wayixia-box mouseselected" && item.style.display == '') {
      var url = item.getAttribute('data-url');
      extension.block_image_remove(url);
      remove_items.push(item);
    }
  });
  
  for(var i=0; i < remove_items.length; i++) {
    var item = remove_items[i];
    item.parentNode.removeChild(item);
  }
}

Q.Ready(function() {
  document.body.ondragstart  =function() { return false; }
  document.body.onselectstart=function() { return false; }
  
  var hash = location.hash;
  if(hash == "#about") {
    init_about();     
  } else {
    init(); 
  }
});


