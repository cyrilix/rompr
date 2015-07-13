var dbQueue = function() {

	// This is a queueing mechanism for the local database in order to avoid deadlocks.

	var queue = new Array();
	var throttle = null;

	return {

		request: function(data, success, fail) {

			queue.push( {flag: false, data: data, success: success, fail: fail } );
			debug.debug("DB QUEUE","New request",data);
			if (throttle == null && queue.length == 1) {
				dbQueue.dorequest();
			}

		},

		dorequest: function() {

			var req = queue[0];
			clearTimeout(throttle);

            if (req) {
            	if (req.flag) {
            		debug.error("DB QUEUE","Request just pulled from queue is already being handled");
            		return;
            	}
				queue[0].flag = true;
				debug.trace("DB QUEUE","Taking next request from queue",req.data);
			    $.ajax({
			        url: "backends/sql/userRatings.php",
			        type: "POST",
			        data: req.data,
			        dataType: 'json',
			        success: function(data) {
	                	req = queue.shift();
			        	debug.trace("DB QUEUE","Request Success",req);
			        	req.success(data);
			        	throttle = setTimeout(dbQueue.dorequest, 50);
			        },
			        error: function(data) {
	                	req = queue.shift();
			        	debug.fail("DB QUEUE","Request Failed",req,data);
			        	req.fail(data);
			        	throttle = setTimeout(dbQueue.dorequest, 50);
			        }
			    });

	        } else {
            	throttle = null;
	        }
		}
	}
}();

