// ==UserScript==
// @name      Hack LDR API
// @namespace http://d.hatena.ne.jp/youpy/
// @include   http://reader.livedoor.com/reader/
// @version   1.0.0
// ==/UserScript==

/*
 special thanks to youpy
*/

(function(){
	var w = unsafeWindow;
	var NativeAPI = w.API.prototype.post;
	var Conf = {};
	var mode = GM_getValue("mode") || "ldr";
	var CurrentMode;
	var servers = {};

	function init(){
		load_servers();
		CurrentMode = Conf[mode];
		hackAPI();
	}

	function change_mode(mode){
		CurrentMode = Conf[mode];
		GM_setValue("mode", mode);
	}
	function load_servers(){
	 	var s = GM_getValue("servers");
	 	if(s){
		 	servers = eval(s);
		 	for(var i in servers){
				Conf[i] = new PlaggerServer(i);
			}
		}
	}

	function save_servers(){
		// to json, firefox only
		var json = servers.toSource();
		GM_setValue("servers", json);
	}
	function add_server(name,host){
		name = name.toLowerCase();
		if(!/^http/.test(host)){
			servers[name] = "http://" + host + "/";
		} else {
			servers[name] = host;
		}
		Conf[name] = new PlaggerServer(name);
		save_servers();
	}
	function delete_server(name){
		name = name.toLowerCase();
		if(servers.hasOwnProperty(name)){
			delete servers[name];
			save_servers();
			return 1
		} else {
			return 0
		}
	}
	function hackAPI(){
		w.API.prototype.post = function(param, onload){
			var ap = this.ap;
			var sel = CurrentMode.route(ap);
			return sel.api.apply(this, arguments);
		}
	}
	var LDR = {
		api : NativeAPI,
		route: function(){ return this },
		start: function(){
			w.Control.reload_subs();
		}
	};
	Conf.ldr = LDR;

	function PlaggerServer(name){
		this.name = name;
		this.server = servers[name];
		this.api  = CrossDomainAPI(this);
	}
	PlaggerServer.prototype.route = function(ap){
		if(/config/.test(ap)){
			return LDR
		} else {
			return this
		}
	};
	PlaggerServer.prototype.start = function(option){
		if(option){
			this.server = option;
			servers[this.name] = option;
			save_servers();
		}
		w.Control.reload_subs();
	}
	
	w.after_init.add(init);

/*
 setup command
*/
	var command = w.vi;
	command.use = function(param){
		var args = param.split(/\s+/);
		var mode = args[0].toLowerCase();
		var option = args[1];
		if(Conf[mode]){
			w.message(mode + " mode");
			change_mode(mode);
			Conf[mode].start(option);
		} else {
			w.message("\"" + mode + "\" mode was not found.");
		}
	};
	command.plagger = function(){
		var args = arguments;
		var mode = args[0];
		w.message("plagger!");
		if(mode == "add"){
			var name = args[1] || prompt("input: server name. (ex: plagger)", "");
			var host = args[2] || prompt("input: server address for " + name + ". (ex: localhost:3000)", "");
			add_server(name,host)
			save_servers();
			w.message("[ :use "+name+" ] to connect " + host);
			return;
		}
		if(mode == "delete"){
			var p = args[1] || prompt("input: server name to delete");
			var res = delete_server(p);
			w.message(res ? ("delete > " + p) : ("not found > " + p))
			return;
		}
		// help
		var buf = [
			"usage:",
			" plagger add [name] [address] : add server",
			" plagger delete [name] : delete server",
			"----------",
			"server list:",
			"use ldr > http://reader.livedoor.com/"
		];
		for(var i in servers){
			buf.push("use " + i + " > " + servers[i])
		}
		alert(buf.join("\n"));
	};


/*
 CrossDomain API
*/
	Function.prototype.bind = function(thisObj){
		var self = this;
		return function(){
			return self.apply(thisObj,arguments);
		}
	};
	function CrossDomainAPI(conf){
		return function(param, onload){
			var onload = onload || this.onload;
			var oncomplete = this.onComplete;
			if(typeof onload != "function"){
				onload = function() {};
			}
			GM_xmlhttpRequest({
				method: 'POST',
				url: conf.server + this.ap,
				data: unsafeWindow.Object.toQuery(param),
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				onload: function(response) {
					oncomplete();
					var responseText = response.responseText;
					unsafeWindow.API.last_response = responseText;
					var json = unsafeWindow.JSON.parse(responseText);
					if(json){
						onload(json);
					} else {
						unsafeWindow.message("can't load data");
						unsafeWindow.show_error();
					}
				}.bind(this)
			});
			return this;
		};
	}

})();