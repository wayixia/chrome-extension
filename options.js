
var g_option_window = null;
var g_about_window = null;
var g_block_window = null;
var g_block_images_box = null;

function init_about() {
  g_about_window = Q.alert({
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

  
  Q.$('donate-with-alipay').onclick = function() {
    Q.alert({
      title: '扫描二维码资助',
      wstyle: 'w-window q-attr-no-icon',
      width: 256, height: 325,
      content: '<img src="http://www.wayixia.com/themes/default/donate-with-alipay-code.png">'
    });
  } // donate-with-alipay
}

function init_setting() {
  var extension = chrome.extension.getBackgroundPage();
  // save path
  Q.$('save_path').value = extension.user_config_get('save_path');
  // date folder
  var option_date_folder = (extension.user_config_get('date_folder') != '0');
  var date_folder = new Q.CheckBox({ id : "date_folder", checked: option_date_folder});
  // filter rules
  var option_filter_rules = extension.filter_rule_is_enabled();
  Q.$('manager_filter_rules').disabled = !option_filter_rules;
  var filter_rules = new Q.CheckBox({ id : "filter_rules_enable",
    checked: option_filter_rules,
    onchange : function(checked) {
      Q.$('manager_filter_rules').disabled = !checked;
    }
  });

  g_option_window = new Q.Dialog({
    width: 706,
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
    g_block_images_box = new Q.ImagesBox({id: 'wayixia-list'});
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
    var tpl = t.template('wndx-filter-rules');
    // i18n 
    extract_document(tpl);
    filter_rules_window = new Q.Dialog({
      title: Q.locale_text('filterRulesList'),
      width: 400,
      height: 350, 
      wstyle: "q-attr-no-icon",
      content:  tpl,
      on_close: function() { delete filter_rules_window; filter_rules_window = null; },
      on_create: function() {
        // init dialog
        var d = this;
        
        var filter_rules = chrome.extension.getBackgroundPage().filter_rule_get();
        var rules = [];
        for(var name in filter_rules.rules) {
          rules.push(filter_rules.rules[name]);
        }
        var store = new Q.Store({
          data: rules
        });
        d.table = new Q.Table({ 
          title: Q.locale_text('filterRulesList'), 
          wstyle: "q-attr-no-title",
          id: d.item('list'),
          columns: [
            { name: 'url', title: Q.locale_text('colName'), align:'left', fixed: true, width: 398, isHTML: true, renderer : function(record) {return record['name'];} }
          ],
          store: store,
          row_onclick : function(row) {
            var url = this.getRecord(row).url;
          },
          row_onmouseover : function(row) {},
          row_onmouseout : function(row) {},
        });
      },
      buttons: [
        {text: Q.locale_text('btnClose'), style: "syscancelbtn", onclick : function() { return true; }}
      ]
    });

    filter_rules_window.domodal();
    filter_rules_window.table.autosize();
  });


}

Q.ready(function() {
  var hash = location.hash;
  if(hash == "#about") {
    init_about();     
  } else {
    init_setting(); 
  }
});


