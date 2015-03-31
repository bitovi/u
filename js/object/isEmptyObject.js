module.exports = function (object) {
	var prop;
	for (prop in object) {
		break;
	}
	return prop === undefined;
};