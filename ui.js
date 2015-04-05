
var wayixia_errors = [];
var wayixia_source_tab_id = null;
var wayixia_help_menu = null;
var g_report_window = null;

Q.Ready(function() {

document.body.ondragstart  =function() { return false; }
document.body.onselectstart=function() { return false; }
Q.$('wayixia-close').onclick = function(evt) {
  deactive();
}

//Q.$('wayixia-bugs-num').style.vi = '';
Q.$('wayixia-bugs').onclick = function(evt) {
  console.log('test');
  g_about_window = new Q.Dialog({
    title: locale_text('extFeedback'),
    width: 500,
    height: 200, 
    wstyle: "q-attr-no-icon",
    content:  wayixia_errors, //Q.$('layer-about'),
    on_close: function() { delete g_about_window; g_about_window = null; },
    on_ok: function() { return false; }
  });

  g_about_window.domodal();
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
  text: "建议反馈",
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
