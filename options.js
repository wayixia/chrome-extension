
var g_option_window = null;
var g_about_window = null;
var g_block_window = null;
var g_block_images_box = null;

function init_about() {
  g_about_window = new Q.MessageBox({
    title: locale_text('extAbout'),
    width: 500,
    height: 350, 
    wstyle: "q-attr-no-icon",
    content: Q.$('layer-about'),
    on_close: function() {window.close();},
    on_ok: function() {window.close();}
  });

  Q.$('layer-about').style.visibility = 'visible';
  Q.$('layer-about-version').innerText = locale_text('extVersion') + ': v.' + chrome.runtime.getManifest().version;
}

function init() {
  var extension = chrome.extension.getBackgroundPage();
  Q.$('save_path').value = extension.user_config_get('save_path');
  var option_date_folder = (extension.user_config_get('date_folder') != '0');
  var date_folder = new Q.checkbox({ id : "date_folder"});
  date_folder.set_check(option_date_folder);
  g_option_window = new Q.Dialog({
    width: 600,
    height: 430,
    wstyle: "q-attr-no-icon",
    title: locale_text('extOptions'),
    content: Q.$('layer'),
    on_close: function() { window.close(); },
    buttons : [
      { text: locale_text('btnSave'), onclick: function() {
         wayixia_track_event('option', 'save');
         wayixia_track_event('option-date-folder', date_folder.checked()?'checked':'unchecked');
         extension.user_config_set('save_path', Q.$('save_path').value);
         extension.user_config_set('date_folder', (date_folder.checked())?1:0);
         new Q.MessageBox({title: locale_text('extShortName'), 
           content: '<div style="margin:auto; padding:20px;font-size:14px;">'+locale_text('saveOptions')+'</div>'});
         return false;
        }
      },
      { text: locale_text('qCancel'), style: 'syscancelbtn', onclick: function() {
          wayixia_track_event('option', 'cancel');
          return true; 
        }
      },
    ]  
  });
  Q.$('layer').style.visibility = 'visible';
  g_option_window.domodal($GetDesktopWindow());

  // block images
  Q.$('manager_block_images').onclick = function() {
    wayixia_track_button_click(this);
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
    title: locale_text('haveBlocked'),
    content: Q.$('layer-block-images'),
    buttons: [
      { text: locale_text('btnUnblock'), onclick: function() { block_images_remove(); return false; }  },
      { text: locale_text('qCancel'), style:'syscancelbtn', onclick: function() { return true; } 
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
    if((item.className.indexOf("mouseselected") != -1) && item.style.display == '') {
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
  
  Q.addEvent(document, 'keyup', function(evt) {
    var evt = evt || window.event;
    var kcode = evt.which || evt.keyCode;
    if(kcode == 27) { // ESC
      wayixia_track_event('deactive', 'shortcut-ESC');
      setTimeout(function() { window.close(); }, 1000);
    }
  })
  var hash = location.hash;
  if(hash == "#about") {
    init_about();     
  } else {
    init(); 
  }
});


