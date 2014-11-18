
function deactive() {
  window.close();
}

function init(){
	// wayixia
	Q.$('wayixia-all-images').onclick = function() {
	  chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
     function(tabs){
       extension.on_click_wa_all({}, tabs[0]);
     }
    );
	  deactive();
	}
  
  Q.$('wayixia-options').onclick = function() {
		deactive();
		extension.on_click_open_options();
	}	
	
  Q.$('wayixia-aboutus').onclick = function() {
		deactive();
	}	

  extension = chrome.extension.getBackgroundPage();
	document.body.style.visibility='visible';
};

Q.Ready(function() {
  init();
});

