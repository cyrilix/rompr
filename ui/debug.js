window.debug = (function() {

	var level = 9;
	var ignoring = [];
	var highlighting = [];
	var colours = [];
	var focuson = null;

	function doTheLogging(css, module, logtype, args) {

		if (focuson !== null && focuson != module) {
			return;
		}

		var string = module;

		if (ignoring[module]) {
			return true;
		} else if (highlighting[module]) {
			css = "font-weight:bold";
		}

		while (string.length < 18) {
			string = string + " ";
		}
		string = string + ": ";
		var a = new Date();
		string = a.toLocaleTimeString()+" : "+string

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

		// Level 9
		debug: function() {
			if (level > 8) {
				var args = Array.prototype.slice.call(arguments);
				var module = args.shift();
				doTheLogging("color:#999999", module, 'log', args);
			}
		},

		// Level 8
		log: function() {
			if (level > 7) {
				var args = Array.prototype.slice.call(arguments);
				var module = args.shift();
				doTheLogging("", module, 'log', args);
			}
		},

		// Level 7
		mark: function() {
			if (level > 6) {
				var args = Array.prototype.slice.call(arguments);
				var module = args.shift();
				var colour = '#009933';
				if (colours[module]) { colour = colours[module] }
				doTheLogging("color:"+colour, module, 'log', args);
			}
		},

		// Level 6
		shout: function() {
			if (level > 5) {
				var args = Array.prototype.slice.call(arguments);
				var module = args.shift();
				var colour = '#996d00';
				if (colours[module]) { colour = colours[module] }
				doTheLogging("color:"+colour, module, 'log', args);
			}
		},

		// Level 3
		fail: function() {
			if (level > 2) {
				var args = Array.prototype.slice.call(arguments);
				var module = args.shift();
				doTheLogging("color:#ff0000", module, 'log', args);
			}
		},

		// Level 2
		warn: function() {
			if (level > 1) {
				var args = Array.prototype.slice.call(arguments);
				var module = args.shift();
				doTheLogging("", module, 'warn', args);
			}
		},

		// Groups operate at level 2
		group: function() {
			if (level > 1) {
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
			if (level > 1) {
				console.groupEnd();
			}
		},

		// Level 1
		error: function() {
			if (level > 0) {
				var args = Array.prototype.slice.call(arguments);
				var module = args.shift();
				doTheLogging("", module, 'error', args);
			}
		},

		ignore: function(module) {
			ignoring[module] = true;
		},

		highlight: function(module) {
			highlighting[module] = true;
		},

		focus: function(module) {
			focuson = module;
		},

		// Use this to set the colour used in debug.mark for a specific module
		// Otherwise, a lurid green will be used :)
		// Specify your colour as a string, like #fe6830
		setcolour: function(module, colour) {
			colours[module] = colour;
		}

	}

})();