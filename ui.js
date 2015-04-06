
var wayixia_errors = [];
var wayixia_source_tab_id = null;
var wayixia_help_menu = null;
var wayixia_report_window = null;
var wayixia_ui_wndx = null;

Q.Ready(function() {

document.body.ondragstart  =function() { return false; }
document.body.onselectstart=function() { return false; }
// set locale
Q.set_locale_text(locale_text);

Q.$('wayixia-close').onclick = function(evt) {
  deactive();
}

/*
Q.$('wayixia-title-bar').onclick=function(){ 
  wayixia_track_event('deactive', 'topbar');
  deactive();  
}

Q.$('wayixia-user-menu').onmousedown = function(evt) {
  evt = evt || window.event;
  evt.cancelBubbule = true;
  evt.returnValue = false;
  return true;
}
*/

Q.$('wayixia-bugs').onclick = function(evt) {
  console.log('test');
  ui(function(t) {
    var tpl = t.template('wndx-errors');
    var item_tpl = t.template('wndx-item-errors');
    // i18n 
    extract_document(tpl);
    wayixia_report_window = new Q.Dialog({
      title: locale_text('extFeedback'),
      width: 500,
      height: 500, 
      wstyle: "q-attr-no-icon",
      content:  tpl, //wayixia_errors, //Q.$('layer-about'),
      on_create: function() {
        // init dialog
        var d = this;
        var list = d.item('list');
        var item = qid(item_tpl, 'item');
        for(var i=0; i < wayixia_errors.length; i++) {
          var list_item = item.cloneNode(true);
          var url = qid(list_item, 'url');
          url.innerText = wayixia_errors[i].url;
          var err = qid(list_item, 'info');
          err.innerText = wayixia_errors[i].error;
          list.appendChild(list_item);
        }
      },
      on_close: function() { delete wayixia_report_window; wayixia_report_window = null; },
      buttons: [
        {text: " 提 交 ", onclick : function() { return true; }},
        {text: " 取 消 ", style: "syscancelbtn", onclick : function() { return true; }},
      ]
    });

    wayixia_report_window.domodal();
  });
}

Q.$('wayixia-bugs').title = locale_text('extFeedback'); //"feedback & suggestions to us.";

// init drop menu
wayixia_help_menu = new class_menu({
  style: "wayixia-menu", 
  on_popup: function(popup) {
    if(popup) {
      Q.addClass(Q.$('wayixia-help'), "q-active");
    } else {
      Q.removeClass(Q.$('wayixia-help'), "q-active");
    }
  }
}); 

var menu_suggest = new class_menuitem({
  text: "帮助中心",
  callback : function(menuitem) {
  }
});

wayixia_help_menu.addMenuItem(menu_suggest);
wayixia_help_menu.hide();

// init menu button
Q.$('wayixia-help').onclick = function(evt) {
  wayixia_help_menu.showElement(this, evt);
}


});

function background_warning(o) {
  //var extension = chrome.extension.getBackgroundPage();
  //var warnnings = extension.warnnings();
  wayixia_errors.push(o);
  if(wayixia_errors.length > 0) {
    Q.$('wayixia-bugs-num').style.visibility = 'visible';
    Q.$('wayixia-bugs-num').innerText = (wayixia_errors.length>9)?'N':wayixia_errors.length;
    Q.$('wayixia-bugs').title = wayixia_errors.length + " download items failed, report a bug to us.";
    
  } else {
    Q.$('wayixia-bugs-num').style.display = 'hidden';
    Q.$('wayixia-bugs').title = locale_text('extFeedback');  //"feedback & suggestions to us.";
  }
}


function deactive() {
    back2page();
    window.close();
}

function back2page() {
  if(wayixia_source_tab_id) {
    chrome.tabs.update(wayixia_source_tab_id, {selected: true});
  }
}

function ui(f) {
  if(wayixia_ui_wndx) {
    f(wayixia_ui_wndx);
  } else {
    wayixia_ui_wndx = new Q.ui({src: 'wndx_template.html', oncomplete:  function(ok) {
      if(ok) {
        // bind css style from template file
        wayixia_ui_wndx.bind_css();
        f(wayixia_ui_wndx);
      } else
        Q.printf('Load template of wndx failed. File is not exists.');
    }});
  }
}

