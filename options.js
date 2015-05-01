
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

function init_setting() {
  var extension = chrome.extension.getBackgroundPage();
  // save path
  Q.$('save_path').value = extension.user_config_get('save_path');
  // date folder
  var option_date_folder = (extension.user_config_get('date_folder') != '0');
  var date_folder = new Q.checkbox({ id : "date_folder", checked: option_date_folder});
  // filter rules
  var option_filter_rules = extension.filter_rule_is_enabled();
  Q.$('manager_filter_rules').disabled = !option_filter_rules;
  var filter_rules = new Q.checkbox({ id : "filter_rules_enable",
    checked: option_filter_rules,
    onchange : function(checked) {
      Q.$('manager_filter_rules').disabled = !checked;
    }
  });

  g_option_window = new Q.Dialog({
    width: 800,
    height: 530,
    wstyle: "q-attr-no-icon",
    title: locale_text('extOptions'),
    content: Q.$('layer'),
    on_close: function() { window.close(); },
    buttons : [
      { text: locale_text('btnSave'), onclick: function() {
         wayixia_track_event('option', 'save');
         wayixia_track_event('option-date-folder', date_folder.checked()?'checked':'unchecked');
         // save settings
         extension.user_config_set('save_path', Q.$('save_path').value);
         extension.user_config_set('date_folder', (date_folder.checked())?1:0);
         extension.filter_rule_enable(filter_rules.checked());
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
  
  Q.$('manager_filter_rules').onclick = function() {
    display_filter_rules();
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

function display_filter_rules() {
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

Q.Ready(function() {
  var hash = location.hash;
  if(hash == "#about") {
    init_about();     
  } else {
    init_setting(); 
  }
});


