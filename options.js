
var g_option_window = null;
var g_about_window = null;
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


