
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
    result_url = result_url.replace(re2, 
      function(w,w2,w3,w4) {
        if(w2 == 'width') {
          return pre_width;
        } else if(w2=='height') {
          return (item.height * pre_width) / (item.width*1.0); 
        }
       
        return rule[w2];
      }
    );  
  }



  return result_url;

