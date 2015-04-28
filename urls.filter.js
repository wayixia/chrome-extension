
function filter_rules_get(url) {
  var rules = {
    "ww2.sinaimg.cn" : {
      rule: "\w+:\/\/[a-zA-Z0-9\-\.]+\/(\w+)\/.*",
      params : ["large"]
  }

  var result_url = url;
  var re = /\w+:\/\/([a-zA-Z0-9\-\.]+)(\/.*)/;
  if(re.test(url)) {
    var domain = RegExp.$1;
    var path = RegExp.$2;
    var rule = rules[domain];
    var re2 = new RegExp(rule.rule);
    var arr = result_url.matchreplace(re2,  
      function(w,w2,w3,w4) {
        
        return rule[w2];
      }
    );  
  }

  /*
  function test(){   
  var str = "";
  for(var i=0;i<arguments.length;i++){   
    str += ("第"+(i+1)+"个参数的值："+arguments[i]) + "\n"; 
  }
  alert(str)
}   
//var reg=new RegExp("\\d","g");   
//var str="abd1afa4sdf";   
//str.replace(reg,test);   

var s = "http://ww2.sinaimg.cn/bmiddle/855834d5jw1erlg2u1mnnj20xc18gags.jpg"
var re = new RegExp("\\w+:\\/\\/([a-zA-Z0-9\\-\\.]+)\\/(\\w+)(\\/.*)", "ig");
var re2 = new RegExp("\\w+(:\\/\\/)([a-zA-Z0-9\\-\\.]+)\\/(\\w+)(\\/.*)", "ig");
alert(re.test(s))
s.replace(re, test);
  */

  return result_url;

