// ==UserScript==
// @name Hack LDR API
// @namespace http://d.hatena.ne.jp/youpy/
// @include http://reader.livedoor.com/reader/
// ==/UserScript==

var yourhost = 'http://YOURHOST.EXAMPLE.COM:3000';

Function.prototype.bind = function(thisObj){
  var self = this;
  return function(){
    return self.apply(thisObj,arguments);
  }
};

unsafeWindow.API.prototype.post = function(param, onload){
  var host;
  if (this.ap.match("^/api/config/")) {
    host = 'http://reader.livedoor.com';
  } else {
    host = yourhost;
  }
  var onload = onload || this.onload;
  var oncomplete = this.onComplete;
  if(typeof onload != "function"){
    onload = function() {};
  }
  GM_xmlhttpRequest({
    method: 'POST',
    url: host + this.ap,
    data: unsafeWindow.Object.toQuery(param),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    onload: function(response) {
      oncomplete();
      var responseText = response.responseText;
//      alert(responseText);
      unsafeWindow.API.last_response = responseText;
      var json = unsafeWindow.JSON.parse(responseText);
      if(json){
        onload(json);
      } else {
        unsafeWindow.message("データをロードできません。");
        unsafeWindow.show_error();
      }
    }.bind(this)
  });
  return this;
};
