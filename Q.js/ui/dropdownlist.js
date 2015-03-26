/*-------------------------------------------------------
  file: dropdownlist.js
  date: 2015-03-22
  author: Q
---------------------------------------------------------*/


Q.dropdownlist = Q.extend({
hwnd: null,
drop_wnd: null,
ctrl: null,
__init__: function(json) {
  var _this = this;
  this.hwnd = document.createElement('BUTTON');
  this.hwnd.className = 'q-select';
  Q.addClass(this.hwnd, json.wstyle);
  this.on_change = json.on_change || function(text, value) {};
  this.ctrl = Q.$(json.render);
  this.ctrl.parentNode.insertBefore(this.hwnd, this.ctrl);
  this.ctrl.onchange = ( function(o, c) {
    return function(evt) {
      if(o.set_text(c.options[c.selectedIndex].text))
        o.on_change(c.options[c.selectedIndex].text, c.options[c.selectedIndex].value);
    }
  })(this, this.ctrl);
  var bar = new class_menubar();
  this.drop_wnd = new class_menu({
    style: json.wstyle, 
    on_popup: function(popup) {
      if(popup)
        Q.addClass(_this.hwnd, "checked");
      else
        Q.removeClass(_this.hwnd, "checked");
    }
  });
  if(this.ctrl.tagName.toLowerCase() == "select") {
    var len = this.ctrl.options.length;
    for(var i=0; i < len; i++) {
      var m4 = new class_menuitem({text: this.ctrl.options[i].text, data:  this.ctrl.options[i].value, callback: Q.bind_handler(_this, _this.on_item_changed)});
      this.drop_wnd.addMenuItem(m4);
      if(i == this.ctrl.selectedIndex) {
        this.on_item_changed(m4);
      }
    }
  }
  this.drop_wnd.hide(); 
  bar.append(this.hwnd, this.drop_wnd);
},

on_item_changed: function(m) {
  this.set_value(m.data);
  if(this.set_text(m.hwnd.innerText))
    this.on_change(m.hwnd.innerText, m.data);
},

set_text : function(text) {
  if(this.hwnd.innerText == text) {
    return false;
  } else {
    this.hwnd.innerText = text;
  }

  return true;
},

set_value : function(value) {
  var e = this.ctrl;
  for(var i=0;i<e.options.length;i++) {
    if(e.options[i].value == value) {
      e.options[i].selected = true;
      break;
    }
  }
},
 
}); // code end


