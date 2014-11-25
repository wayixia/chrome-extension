
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
  
  Q.$('wayixia-screenshot').onclick = function() {
		deactive();
		extension.on_click_screenshot();
	}

  Q.$('wayixia-options').onclick = function() {
		deactive();
		extension.on_click_open_options();
	}	
	
  Q.$('wayixia-aboutus').onclick = function() {
		deactive();
		extension.on_click_open_about();
	}	

  extension = chrome.extension.getBackgroundPage();
	document.body.style.visibility='visible';
};

Q.Ready(function() {
  document.body.ondragstart  =function() { return false; }
  document.body.onselectstart=function() { return false; }
  init();
});

