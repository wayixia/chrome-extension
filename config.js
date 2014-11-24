
var config = Q.extend({
  save_path: null,
	__init__: function() {
	  this.save_path = localStorage.getItem('save_path');
	},

	save: function() {
		if(this.save_path == '') {
      localStorage.removeItem('save_path');
		} else {	
	    localStorage.setItem('save_path', this.save_path);
		}
	}
});

var g_config = new config;

