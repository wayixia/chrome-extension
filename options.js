
var g_option_window = null;


function init() {
  Q.$('save_path').value = g_config.save_path;
}


Q.Ready(function() {
  document.body.ondragstart  =function() { return false; }
  document.body.onselectstart=function() { return false; }
  init(); 
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
  
	g_option_window.domodal($GetDesktopWindow());
});


