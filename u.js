var glbl = typeof window !== "undefined" ? window : global;

var u = {};
if (typeof GLOBALU !== 'undefined' && GLOBALU) {
	glbl.u = u;
}
u.global = glbl;


module.exports = u;
