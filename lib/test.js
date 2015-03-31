"format amd";

define(["steal-qunit","ujs/lib/"+LIBRARY+"/"+LIBRARY,"ujs/lib/"+LIBRARY+"/test"], function(QUnit, u){
	
	QUnit.module("standard utils",{});

	test("u.isArray", function(){
		var arr = [];
		equal( u.isArray(arr) , true );
	});
		
});




