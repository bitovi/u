can["import"] = function(moduleName) {
		var deferred = new can.Deferred();
		
		if(typeof window.System === "object") {
			window.System["import"](moduleName).then(can.proxy(deferred.resolve, deferred),
				can.proxy(deferred.reject, deferred));
		} else if(window.define && window.define.amd){
			
			window.require([moduleName], function(value){
				deferred.resolve(value);
			});
			
		} else if(window.steal) {
			
			steal.steal(moduleName, function(value){
				deferred.resolve(value);
			});
			
		} else if(window.require){
			deferred.resolve(window.require(moduleName));
		} else {
			// ideally this will use can.getObject
			deferred.resolve();
		}
		
		return deferred.promise();
	};