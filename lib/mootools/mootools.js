require("mootools");

var u = require("../../u"),
	event = require("../../event/event"),
	attr = require("../../dom/attr/attr"),
	proxy = require("../../js/function/proxy");
	
	
require("../../dom/inserted/inserted");
require("../../dom/fragment");
require("../../js/deferred");
require("../../js/object/isPlainObject");
require("../../js/object/extend");

/* jshint maxdepth:5 */
// mootools.js
// ---------
// _MooTools node list._
//
// Map string helpers.
u.trim = function (s) {
	return s ? s.trim() : s;
};

// Map array helpers.
u.makeArray = function (item) {
	// All other libraries return a copy if item is an array.
	// The original Mootools Array.from returned the same item so we need to slightly modify it
	if (item === null) {
		return [];
	}
	try {
		return Type.isEnumerable(item) && typeof item !== 'string' ? Array.prototype.slice.call(item) : [item];
	} catch (ex) {
		// some things like DOMNodeChildCollections don't slice so good.
		// This pains me, but it has to be done.
		var arr = [],
			i;
		for (i = 0; i < item.length; ++i) {
			arr.push(item[i]);
		}
		return arr;
	}
};
u.isArray = function (arr) {
	return typeOf(arr) === 'array';
};
u.inArray = function (item, arr, fromIndex) {
	if (!arr) {
		return -1;
	}
	return Array.prototype.indexOf.call(arr, item, fromIndex);
};
u.map = function (arr, fn) {
	return Array.from(arr || [])
		.map(fn);
};
// Map object helpers.
u.param = function (object) {
	return Object.toQueryString(object);
};
u.isEmptyObject = function (object) {
	return Object.keys(object)
		.length === 0;
};
// Map function helpers.
u.proxy = function () {
	var args = u.makeArray(arguments),
		func = args.shift();
	return func.bind.apply(func, args);
};
u.isFunction = function (f) {
	return typeOf(f) === 'function';
};
// Make this object so you can bind on it.
u.bind = function (ev, cb) {
	// If we can bind to it...
	if (this.bind && this.bind !== u.bind) {
		this.bind(ev, cb);
	} else if (this.nodeName && (this.nodeType && this.nodeType !== 11)) {
		u.$(this)
			.addEvent(ev, cb);
	} else if (this.addEvent) {
		this.addEvent(ev, cb);
	} else {
		// Make it bind-able...
		u.addEvent.call(this, ev, cb);
	}
	return this;
};
u.unbind = function (ev, cb) {
	// If we can bind to it...
	if (this.unbind && this.unbind !== u.unbind) {
		this.unbind(ev, cb);
	} else if (this.nodeName && (this.nodeType && this.nodeType !== 11)) {
		u.$(this)
			.removeEvent(ev, cb);
	} else if (this.removeEvent) {
		this.removeEvent(ev, cb);
	} else {
		// Make it bind-able...
		u.removeEvent.call(this, ev, cb);
	}
	return this;
};
// Alias on/off to bind/unbind respectively
u.on = u.bind;
u.off = u.unbind;
u.trigger = function (item, event, args, bubble) {
	// Defaults to `true`.
	bubble = bubble === undefined ? true : bubble;
	args = args || [];
	var propagating = true;
	if (item.fireEvent) {
		item = item[0] || item;
		// walk up parents to simulate bubbling .
		while (item && propagating) {
			// Handle walking yourself.
			if (!event.type) {
				event = {
					type: event,
					target: item,
					stopPropagation: function () {
						propagating = false;
					}
				};
			}
			var events = item !== window ? u.$(item)
				.retrieve('events')[0] : item.retrieve('events');
			if (events && events[event.type]) {
				events[event.type].keys.each(function (fn) {
					fn.apply(item, [event].concat(args));
				}, this);
			}
			// If we are bubbling, get parent node.
			if (bubble && item.parentNode && item.parentNode.nodeType !== 11) {
				item = item.parentNode;
			} else {
				item = null;
			}
		}
	} else {
		if (typeof event === 'string') {
			event = {
				type: event
			};
		}
		event.target = event.target || item;
		u.dispatch.call(item, event, u.makeArray(args));
	}
};
u.delegate = function (selector, ev, cb) {
	if (this.delegate) {
		this.delegate(selector, ev, cb);
	} else if (this.addEvent) {
		this.addEvent(ev + ':relay(' + selector + ')', cb);
	} else {
		// make it bind-able ...
		u.bind.call(this, ev, cb);
	}
	return this;
};
u.undelegate = function (selector, ev, cb) {
	if (this.undelegate) {
		this.undelegate(selector, ev, cb);
	} else if (this.removeEvent) {
		this.removeEvent(ev + ':relay(' + selector + ')', cb);
	} else {
		u.unbind.call(this, ev, cb);
	}
	return this;
};
var optionsMap = {
	type: 'method',
	success: undefined,
	error: undefined
};
var updateDeferred = function (xhr, d) {
	for (var prop in xhr) {
		if (typeof d[prop] === 'function') {
			d[prop] = function () {
				xhr[prop].apply(xhr, arguments);
			};
		} else {
			d[prop] = prop[xhr];
		}
	}
};
u.ajax = function (options) {
	var d = u.Deferred(),
		requestOptions = u.extend({}, options),
		request;
	// Map jQuery options to MooTools options.
	for (var option in optionsMap) {
		if (requestOptions[option] !== undefined) {
			requestOptions[optionsMap[option]] = requestOptions[option];
			delete requestOptions[option];
		}
	}
	// Mootools defaults to 'post', but Can expects a default of 'get'
	requestOptions.method = requestOptions.method || 'get';
	requestOptions.url = requestOptions.url.toString();
	var success = options.onSuccess || options.success,
		error = options.onFailure || options.error;
	requestOptions.onSuccess = function (response, xml) {
		var data = response;
		updateDeferred(request.xhr, d);
		d.resolve(data, 'success', request.xhr);
		if (success) {
			success(data, 'success', request.xhr);
		}
	};
	requestOptions.onFailure = function () {
		updateDeferred(request.xhr, d);
		d.reject(request.xhr, 'error');
		if (error) {
			error(request.xhr, 'error');
		}
	};
	if (options.dataType === 'json') {
		request = new Request.JSON(requestOptions);
	} else {
		request = new Request(requestOptions);
	}
	request.send();
	updateDeferred(request.xhr, d);
	return d;
};
// Element -- get the wrapped helper.
u.$ = function (selector) {
	if (selector === window) {
		return window;
	}
	return $$(selector && selector.nodeName ? [selector] : selector);
};

// Add `document` fragment support.
var old = document.id;
document.id = function (el) {
	if (el && el.nodeType === 11) {
		return el;
	} else {
		return old.apply(document, arguments);
	}
};
u.append = function (wrapped, html) {
	if (typeof html === 'string') {
		html = u.buildFragment(html);
	}
	return wrapped.grab(html);
};
u.filter = function (wrapped, filter) {
	return wrapped.filter(filter);
};
u.data = function (wrapped, key, value) {
	if (value === undefined) {
		return wrapped[0].retrieve(key);
	} else {
		return wrapped.store(key, value);
	}
};
u.addClass = function (wrapped, className) {
	return wrapped.addClass(className);
};
u.remove = function (wrapped) {
	// We need to remove text nodes ourselves.
	var filtered = wrapped.filter(function (node) {
		if (node.nodeType !== 1) {
			node.parentNode.removeChild(node);
		} else {
			return true;
		}
	});
	filtered.destroy();
	return filtered;
};
u.has = function (wrapped, element) {
	// this way work in mootools
	if (Slick.contains(wrapped[0], element)) {
		return wrapped;
	} else {
		return [];
	}
};
// Destroyed method.
var destroy = Element.prototype.destroy,
	grab = Element.prototype.grab,
	oldSet = Element.prototype.set;
Element.implement({
	destroy: function () {
		u.trigger(this, 'removed', [], false);
		var elems = this.getElementsByTagName('*');
		for (var i = 0, elem;
			(elem = elems[i]) !== undefined; i++) {
			u.trigger(elem, 'removed', [], false);
		}
		destroy.apply(this, arguments);
	},
	grab: function (el) {
		var elems;
		if (el && el.nodeType === 11) {
			elems = u.makeArray(el.childNodes);
		} else {
			elems = [el];
		}
		var ret = grab.apply(this, arguments);
		u.inserted(elems);
		return ret;
	},
	set: function (attrName, value) {
		var isAttributeOrProp = u.inArray(attrName, ["events", "html", "load", "morph", "send", "tag", "tween"]) === -1,
			newValue,
			oldValue;

		if (isAttributeOrProp) {
			oldValue = this.get(attrName);
		}

		var res = oldSet.apply(this, arguments);

		if (isAttributeOrProp) {
			newValue = this.get(attrName);
		}
		if (newValue !== oldValue) {
			u.attr.trigger(this, attrName, oldValue);
		}
		return res;
	}.overloadSetter()
});
u.get = function (wrapped, index) {
	return wrapped[index];
};
// Overwrite to handle IE not having an id.
// IE barfs if text node.
var idOf = Slick.uidOf;
Slick.uidOf = function (node) {
	// for some reason, in IE8, node will be the window but not equal it.
	if (node.nodeType === 1 || node === window || node.document === document) {
		return idOf(node);
	} else {
		return Math.random();
	}
};
Element.NativeEvents.hashchange = 2;

// Setup attributes events

u.attr = attr;

// turn off mutation events for zepto
delete attr.MutationObserver;

Element.Events.attributes = {
	onAdd: function () {
		var el = u.$(this);
		u.data(el, "canHasAttributesBindings", (u.data(el, "canHasAttributesBindings") || 0) + 1);
	},
	onRemove: function () {
		var el = u.$(this),
			cur = u.data(el, "canHasAttributesBindings") || 0;
		if (cur <= 0) {
			u.cleanData(el, "canHasAttributesBindings");
		} else {
			u.data(el, "canHasAttributesBindings", cur - 1);
		}
	}
};

module.exports = u;
