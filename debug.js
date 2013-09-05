window.debug = (function() {

	var level = 9;
	var ignoring = [];
	var highlighting = [];

	function doTheLogging(css, module, logtype, args) {
		var string = module;

		if (ignoring[module]) {
			css = "color:#cccccc";
		} else if (highlighting[module]) {
			css = "font-weight:bold";
		}

		while (string.length < 18) {
			string = string + " ";
		}
		string = string + ": ";

		for (var i in args) {
			if (typeof(args[i]) != "object" || args[i] === null || args[i] === undefined) {
				string = string + " " + args[i];
			}
		}

		if (css != "") {
			console[logtype]("%c"+string,css);
		} else {
			console[logtype](string);
		}

		for (var i in args) {
			if (typeof(args[i]) == "object" && args[i] !== null && args[i] !== undefined) {
				if (ignoring[module]) {
					console.log("                       %O",args[i]);
				} else {
					console.log("                     ",args[i]);
				}
			}
		}

	}

	return {

		setLevel: function(l) {
			level = l;
		},

		log: function() {
			if (level > 7) {
				var args = Array.prototype.slice.call(arguments);
				var module = args.shift();
				doTheLogging("", module, 'log', args);
			}
		},

		debug: function() {
			if (level > 8) {
				var args = Array.prototype.slice.call(arguments);
				var module = args.shift();
				doTheLogging("color:#999999", module, 'log', args);
			}
		},

		warn: function() {
			if (level > 2) {
				var args = Array.prototype.slice.call(arguments);
				var module = args.shift();
				doTheLogging("", module, 'warn', args);
			}
		},

		error: function() {
			if (level > 1) {
				var args = Array.prototype.slice.call(arguments);
				var module = args.shift();
				doTheLogging("", module, 'error', args);
			}
		},

		group: function() {
			if (level > 7) {
				var args = Array.prototype.slice.call(arguments);
				var module = args.shift();
				if (ignoring[module]) {
  					doTheLogging("", module, 'groupCollapsed', args);
				} else {
					doTheLogging("", module, 'group', args);
				}
			}
		},

		groupend: function() {
			if (level > 7) {
				console.groupEnd();
			}
		},

		ignore: function(module) {
			ignoring[module] = true;
		},

		highlight: function(module) {
			highlighting[module] = true;
		}

	}

})();