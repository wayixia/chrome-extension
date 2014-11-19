
var g_option_window = null;

Q.Ready(function() {
  document.body.ondragstart  =function() { return false; }
  document.body.onselectstart=function() { return false; }
  
	g_option_window = new Q.Dialog({
		title: '选项',
	  content: Q.$('layer'),
		bstyle: MSGBOX_YES,
		onok: function() { alert(1); return true; }
	});
  
	g_option_window.domodal($GetDesktopWindow());
});


