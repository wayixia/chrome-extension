
var service = Q.extend({
api: null, 
__init__: function(json) {
  json = json || {};
  this.api = json.api;
},

call : function(method, params, f) {
  var invalid_data = -2;
  Q.Ajax({
    command: this.api + method,
    data: params,
    oncomplete : function(xmlhttp) {
      var res = Q.json_decode(xmlhttp.responseText);
      if(!res)
        f(invalid_data, {});
      else
        f(res.header, res.data);
    },
    onerror : function(xmlhttp) {
      f(xmlhttp.status, {});
    }
  });

},

});


var bugs_service = service.extend({
__init__: function(json) {
  json = {api: "http://api.wayixia.com/?mod=bugs&inajax=true&action="};
  service.prototype.__init__.call(this, json);
},

report_a_bug : function(props, f) {
  this.call("report_a_bug", {props: props}, f);
},

});

var wayixia_bugs_service = new bugs_service;

