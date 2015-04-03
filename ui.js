
Q.Ready(function() {

//Q.$('wayixia-bugs-num').style.vi = '';
Q.$('wayixia-bugs').onclick = function(evt) {
  console.log('test');
}

//Q.$('wayixia-bugs-num').onclick = function(evt) {
//  
//}



});

function background_warning(o) {
  var extension = chrome.extension.getBackgroundPage();
  var warnnings = extension.warnnings();
  if(warnnings.length > 0) {
    Q.$('wayixia-bugs-num').style.visibility = 'visible';
    Q.$('wayixia-bugs-num').innerText = (warnnings.length>9)?'N':warnnings.length;
  } else {
    Q.$('wayixia-bugs-num').style.display = 'hidden';
  }
}

