"format amd";

define(["steal-qunit","ujs/lib/mootools/mootools"], function(QUnit, u){
	
	QUnit.module("mootools methods",{});

	test("inserted events fire", function(){
		
		var div  = document.createElement("div");
		u.bind.call(div,"inserted", function(){
			ok(true);
		});
		
		$('qunit-fixture').grab(div);
	});
		
});




