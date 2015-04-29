
function urls_filter(url) {
  //if(!filter_rule_is_enabled())
  //  return url;
  var rules = {
    "sinaimg.cn" : {
      rule: "(\\w+:\\/\\/[a-zA-Z0-9\\-\\.]+)\\/(square|bmiddle)\\/(.*)",
      fmt : "$1/large/$3"
    }
  }

  //var re = /\w+:\/\/(\w+)\.([a-zA-Z0-9\-\.]+)\/.*/;
  var re = /^\w+:\/\/[0-9a-zA-z\-]+\.([0-9a-zA-Z\-\.]+)\//i;
  if(re.test(url)) {
    var domain = RegExp.$1;
    var rule = rules[domain];
    if(rule) {
      var re2 = new RegExp(rule.rule, "i");
      //var url2 = url.replace(re2, rule.replace);
      //var re2 = new RegExp("(\\w+:\\/\\/[a-zA-Z0-9\\-\\.]+)\\/(\\w+)\\/(.*)", "i");
      var url2 = url.replace(re2, rule.fmt);
      console.log(url + "->" + url2);
      return url2;
    }
  }

  return url;
}
