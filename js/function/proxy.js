module.exports = function (fn, context) {
	return function () {
		return fn.apply(context, arguments);
	};
};