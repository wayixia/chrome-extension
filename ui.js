
var wayixia_errors = [];
var g_report_window = null;
Q.Ready(function() {

//Q.$('wayixia-bugs-num').style.vi = '';
Q.$('wayixia-bugs').onclick = function(evt) {
  console.log('test');
  g_about_window = new Q.MessageBox({
    title: locale_text('extFeedback'),
    width: 500,
    height: 200, 
    wstyle: "q-attr-no-icon",
    content:  "test", //Q.$('layer-about'),
    on_close: function() { delete g_about_window; g_about_window = null; },
    on_ok: function() { return false; }
  });
}

Q.$('wayixia-bugs').title = locale_text('extFeedback'); //"feedback & suggestions to us.";

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

