
var wayixia_errors = [];
var wayixia_source_tab_id = null;
var wayixia_help_menu = null;
var wayixia_report_window = null;
var wayixia_ui_wndx = null;
var wayixia_request_data = {imgs: [], data: {}};

Q.Ready(function() {

document.body.ondragstart  =function() { return false; }
document.body.onselectstart=function() { return false; }

// set locale
Q.set_locale_text(locale_text);

// shortcut
Q.addEvent(document, 'keyup', function(evt) {
  var evt = evt || window.event;
  var kcode = evt.which || evt.keyCode;
  if(kcode == 27) {// ESC
    wayixia_track_event('deactive', 'shortcut-ESC');
    deactive();
  }
});

// display and screenshot view
if(Q.$('wayixia-bugs')) {

Q.$('wayixia-bugs').title = Q.locale_text('extReportABug');
Q.$('wayixia-bugs').onclick = function(evt) {
  wayixia_track_event('report_a_bug', 'report_a_bug');
  ui(function(t) {
    var tpl = t.template('wndx-errors');
    var item_tpl = t.template('wndx-item-errors');
    // i18n 
    extract_document(tpl);
    wayixia_report_window = new Q.Dialog({
      title: Q.locale_text('extReportABug'),
      width: 350,
      height: 350, 
      wstyle: "q-attr-no-icon",
      content:  tpl,
      on_close: function() { delete wayixia_report_window; wayixia_report_window = null; },
      on_create: function() {
        // init dialog
        var d = this;
        d.email = d.item('email');
        d.type  = d.item('type');
        d.message = d.item('message');
        if(wayixia_errors.length > 0) {
          // set error message
          d.type.value = Q.locale_text("stringDownloadImageFailed");
          d.type.disabled = true;
          Q.$('wayixia-bugs-num').style.visibility = 'hidden';
          Q.$('wayixia-bugs').title = Q.locale_text('extReportABug');
        }
      },
      buttons: [
        { text: Q.locale_text('qSubmit'), 
          onclick : function() {
            var d = wayixia_report_window;
            var props = {};

            if(d.type.value == "") {
              alert(Q.locale_text('stringChooseAnBugType'));
              d.type.focus();
              return;
            }

            var expr_email = /^[a-zA-Z0-9\-\.]+@[0-9a-zA-Z\-]+\.\w+$/;
            if(!expr_email.test(d.email.value)) {
              alert(Q.locale_text('stringInvalidEmailFormat'));
              d.email.focus();
              return false;
           }
            props.uri = wayixia_request_data.data.pageUrl || "null";
            props.type = d.type.value;
            props.message = d.message.value;
            props.email = d.email.value;
            props.useragent = navigator.userAgent;
            wayixia_bugs_service.report_a_bug(props, function(r) {
              dismiss(d);
            })
            return false; 
          }
        },
        {text: Q.locale_text('qCancel'), style: "syscancelbtn", onclick : function() { return true; }},
      ]
    });

    wayixia_report_window.domodal();
  });
}

} // Q.$('wayixia-bugs')



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
  text: "常见问题",
  callback : function(menuitem) {
    window.open("http://wayixia.com/chrome/faq");
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
  wayixia_errors.push(o);
  if(wayixia_errors.length > 0) {
    Q.$('wayixia-bugs-num').style.visibility = 'visible';
    Q.$('wayixia-bugs-num').innerText = (wayixia_errors.length>9)?'N':wayixia_errors.length;
    Q.$('wayixia-bugs').title = wayixia_errors.length + ' ' + Q.locale_text('stringDownloadError') ;
    
  } else {
    Q.$('wayixia-bugs-num').style.visibility = 'hidden';
    Q.$('wayixia-bugs').title = Q.locale_text('extReportABug');  //"feedback & suggestions to us.";
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

function dismiss(d) {
  (new Q.Animate({ 
    tween: 'cubic', ease: 'easyin',
    max: 1000, begin: 0, duration: 100,
    bind : function(x) {
      if(x == this.max) {
        d.end_dialog();
      } else {
        d.wnd().style.opacity = ((this.max-x)*1.0) / this.max;
      }
    }
  })).play();
}

function clear_errors() {
  wayixia_errors = [];
  Q.$('wayixia-bugs-num').style.visibility = 'hidden';
  Q.$('wayixia-bugs').title = Q.locale_text('extReportABug');
}

///////////////// wayixia service ////////////////////////////////////


var service = Q.extend({
api: null, 
__init__: function(json) {
  json = json || {};
  this.api = json.api;
},

call : function(method, params, f) {
  var invalid_data = -2;
  Q.Ajax({
    command: this.api + method,
    data: params,
    oncomplete : function(xmlhttp) {
      var res = Q.json_decode(xmlhttp.responseText);
      if(!res)
        f(invalid_data, {});
      else
        f(res.header, res.data);
    },
    onerror : function(xmlhttp) {
      f(xmlhttp.status, {});
    }
  });

},

});


var bugs_service = service.extend({
__init__: function(json) {
  json = {api: "http://api.wayixia.com/?mod=bugs&inajax=true&action="};
  service.prototype.__init__.call(this, json);
},

report_a_bug : function(props, f) {
  this.call("report_a_bug", {props: props}, f);
},

});

var wayixia_bugs_service = new bugs_service;

///////////////// wayixia service end/////////////////////////////////

