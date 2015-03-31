// # u/event
//
// Implements a basic event system that u be used with any type of object.
// In addition to adding basic event functionality, it also provides the `u.event` object 
// that u be mixed into objects and prototypes.
//
// Most of the time when this is used, it will be used with the mixin:
//
// ```
// var SomeClass = u.Construct("SomeClass");
// u.extend(SomeClass.prototype, u.event);
// ```
var u = require("../u.js");

// ## u.event.addEvent
//
// Adds a basic event listener to an object.
// This consists of storing a cache of event listeners on each object,
// that are iterated through later when events are dispatched.
/**
 * @function u.event.addEvent
 * @parent u.event.static
 * @signature `obj.addEvent( event, handler )`
 *
 * Add a basic event listener to an object.
 *
 * @param {String} event The name of the event to listen for.
 * @param {Function} handler The handler that will be executed to handle the event.
 * @return {Object} this
 *
 * @signature `u.event.addEvent.call( obj, event, handler )`
 *
 * This syntax u be used for objects that don't include the `u.event` mixin.
 */
u.addEvent = function (event, handler) {
	// Initialize event cache.
	var allEvents = this.__bindEvents || (this.__bindEvents = {}),
		eventList = allEvents[event] || (allEvents[event] = []);

	// Add the event
	eventList.push({
		handler: handler,
		name: event
	});
	return this;
};

// ## u.event.listenTo
//
// Listens to an event without know how bind is implemented.
// The primary use for this is to listen to another's objects event while 
// tracking events on the local object (similar to namespacing).
//
// The API was heavily influenced by BackboneJS: http://backbonejs.org/
/**
 * @function u.event.listenTo
 * @parent u.event.static
 * @signature `obj.listenTo( other, event, handler )`
 *
 * Listens for an event on another object.
 * This is similar to concepts like event namespacing, except that the namespace 
 * is the scope of the calling object.
 *
 * @param {Object} other The object to listen for events on.
 * @param {String} event The name of the event to listen for.
 * @param {Function} handler The handler that will be executed to handle the event.
 * @return {Object} this
 *
 * @signature `u.event.listenTo.call( obj, other, event, handler )`
 *
 * This syntax u be used for objects that don't include the `u.event` mixin.
 */
u.listenTo = function (other, event, handler) {
	// Initialize event cache
	var idedEvents = this.__listenToEvents;
	if (!idedEvents) {
		idedEvents = this.__listenToEvents = {};
	}

	// Identify the other object
	var otherId = u.cid(other);
	var othersEvents = idedEvents[otherId];
	
	// Create a local event cache
	if (!othersEvents) {
		othersEvents = idedEvents[otherId] = {
			obj: other,
			events: {}
		};
	}
	var eventsEvents = othersEvents.events[event];
	if (!eventsEvents) {
		eventsEvents = othersEvents.events[event] = [];
	}

	// Add the event, both locally and to the other object
	eventsEvents.push(handler);
	u.bind.call(other, event, handler);
};

// ## u.event.stopListening
// 
// Stops listening for events on other objects
/**
 * @function u.event.stopListening
 * @parent u.event.static
 * @signature `obj.stopListening( other, event, handler )`
 *
 * Stops listening for an event on another object.
 *
 * @param {Object} other The object to listen for events on.
 * @param {String} event The name of the event to listen for.
 * @param {Function} handler The handler that will be executed to handle the event.
 * @return {Object} this
 *
 * @signature `u.event.stopListening.call( obj, other, event, handler )`
 *
 * This syntax u be used for objects that don't include the `u.event` mixin.
 */
u.stopListening = function (other, event, handler) {
	var idedEvents = this.__listenToEvents,
		iterIdedEvents = idedEvents,
		i = 0;
	if (!idedEvents) {
		return this;
	}
	if (other) {
		var othercid = u.cid(other);
		(iterIdedEvents = {})[othercid] = idedEvents[othercid];
		// you might be trying to listen to something that is not there
		if (!idedEvents[othercid]) {
			return this;
		}
	}

	// Clean up events on the other object
	for (var cid in iterIdedEvents) {
		var othersEvents = iterIdedEvents[cid],
			eventsEvents;
		other = idedEvents[cid].obj;

		// Find the cache of events
		if (!event) {
			eventsEvents = othersEvents.events;
		} else {
			(eventsEvents = {})[event] = othersEvents.events[event];
		}

		// Unbind event handlers, both locally and on the other object
		for (var eventName in eventsEvents) {
			var handlers = eventsEvents[eventName] || [];
			i = 0;
			while (i < handlers.length) {
				if (handler && handler === handlers[i] || !handler) {
					u.unbind.call(other, eventName, handlers[i]);
					handlers.splice(i, 1);
				} else {
					i++;
				}
			}
			// no more handlers?
			if (!handlers.length) {
				delete othersEvents.events[eventName];
			}
		}
		if (u.isEmptyObject(othersEvents.events)) {
			delete idedEvents[cid];
		}
	}
	return this;
};

// ## u.event.removeEvent
//
// Removes a basic event listener from an object.
// This removes event handlers from the cache of listened events.
/**
 * @function u.event.removeEvent
 * @parent u.event.static
 * @signature `obj.removeEvent( event, handler )`
 *
 * Removes a basic event listener from an object.
 *
 * @param {String} event The name of the event to listen for.
 * @param {Function} handler The handler that will be executed to handle the event.
 * @param {Function} [__validate] An extra function that u validate an event handler 
 *                                as a match. This is an internal parameter and only used 
 *                                for `u/event` plugins.
 * @return {Object} this
 *
 * @signature `u.event.removeEvent.call( obj, event, handler )`
 *
 * This syntax u be used for objects that don't include the `u.event` mixin.
 */
u.removeEvent = function (event, fn, __validate) {
	if (!this.__bindEvents) {
		return this;
	}
	var events = this.__bindEvents[event] || [],
		i = 0,
		ev, isFunction = typeof fn === 'function';
	while (i < events.length) {
		ev = events[i];
		// Determine whether this event handler is "equivalent" to the one requested
		// Generally this requires the same event/function, but a validation function 
		// can be included for extra conditions. This is used in some plugins like `u/event/namespace`.
		if (__validate ? __validate(ev, event, fn) : isFunction && ev.handler === fn || !isFunction && (ev.cid === fn || !fn)) {
			events.splice(i, 1);
		} else {
			i++;
		}
	}
	return this;
};

// ## u.event.dispatch
//
// Dispatches/triggers a basic event on an object.
/**
 * @function u.event.dispatch
 * @parent u.event.static
 * @signature `obj.dispatch( event, args )`
 *
 * Dispatches/triggers a basic event on an object.
 *
 * @param {String|Object} event The event to dispatch
 * @param {Array} [args] Additional arguments to pass to event handlers
 * @return {Object} event The resulting event object
 *
 * @signature `u.event.dispatch.call( obj, event, args )`
 *
 * This syntax u be used for objects that don't include the `u.event` mixin.
 */
u.dispatch = function (event, args) {
	var events = this.__bindEvents;
	if (!events) {
		return;
	}

	// Initialize the event object
	if (typeof event === 'string') {
		event = {
			type: event
		};
	}

	// Grab event listeners
	var eventName = event.type,
		handlers = (events[eventName] || []).slice(0),
		passed = [event];
	
	// Execute handlers listening for this event.
	if(args) {
		passed.push.apply(passed, args);
	}

	for (var i = 0, len = handlers.length; i < len; i++) {
		handlers[i].handler.apply(this, passed);
	}

	return event;
};

// ## u.event.one
//
// Adds a basic event listener that listens to an event once and only once.
/**
 * @function u.event.one
 * @parent u.event.static
 * @signature `obj.one( event, handler )`
 *
 * Adds a basic event listener that listens to an event once and only once.
 *
 * @param {String} event The name of the event to listen for.
 * @param {Function} handler The handler that will be executed to handle the event.
 * @return {Object} this
 */
u.one = function(event, handler) {
	// Unbind the listener after it has been executed
	var one = function() {
		u.unbind.call(this, event, one);
		return handler.apply(this, arguments);
	};

	// Bind the altered listener
	u.bind.call(this, event, one);
	return this;
};

// ## u.event
// Create and export the `u.event` mixin
u.event = {
	// Event method aliases
	/**
	 * @function u.event.on
	 * @parent u.event.static
	 * @signature `obj.on( event, handler )`
	 *
	 * Add a basic event listener to an object.
	 *
	 * This is an alias of [u.event.addEvent addEvent].
	 *
	 * @signature `u.event.on.call( obj, event, handler )`
	 *
	 * This syntax u be used for objects that don't include the `u.event` mixin.
	 */
	on: function() {
		
		return u.addEvent.apply(this, arguments);
		
	},

	/**
	 * @function u.event.off
	 * @parent u.event.static
	 * @signature `obj.off( event, handler )`
	 *
	 * Removes a basic event listener from an object.
	 *
	 * This is an alias of [u.event.removeEvent removeEvent].
	 *
	 * @signature `u.event.off.call( obj, event, handler )`
	 *
	 * This syntax u be used for objects that don't include the `u.event` mixin.
	 */
	off: function() {
		return u.removeEvent.apply(this, arguments);
	},

	/**
	 * @function u.event.bind
	 * @parent u.event.static
	 * @signature `obj.bind( event, handler )`
	 *
	 * Add a basic event listener to an object.
	 *
	 * This is an alias of [u.event.addEvent addEvent].
	 *
	 * @signature `u.event.bind.call( obj, event, handler )`
	 *
	 * This syntax u be used for objects that don't include the `u.event` mixin.
	 */
	bind: u.addEvent,
	/**
	 * @function u.event.unbind
	 * @parent u.event.static
	 * @signature `obj.unbind( event, handler )`
	 *
	 * Removes a basic event listener from an object.
	 *
	 * This is an alias of [u.event.removeEvent removeEvent].
	 *
	 * @signature `u.event.unbind.call( obj, event, handler )`
	 *
	 * This syntax u be used for objects that don't include the `u.event` mixin.
	 */
	unbind: u.removeEvent,
	/**
	 * @function u.event.delegate
	 * @parent u.event.static
	 * @signature `obj.delegate( selector, event, handler )`
	 *
	 * Provides a compatibility layer for adding delegate event listeners.
	 * This doesn't actually implement delegates, but rather allows 
	 * logic that assumes a delegate to still function.
	 *
	 * Therefore, this is essentially an alias of [u.event.addEvent addEvent] with the selector ignored.
	 *
	 * @param {String} selector The **ignored** selector to use for the delegate.
	 * @param {String} event The name of the event to listen for.
	 * @param {Function} handler The handler that will be executed to handle the event.
	 * @return {Object} this
	 *
	 * @signature `u.event.delegate.call( obj, selector, event, handler )`
	 *
	 * This syntax u be used for objects that don't include the `u.event` mixin.
	 */
	delegate: function(selector, event, handler) {
		return u.addEvent.call(this, event, handler);
	},
	/**
	 * @function u.event.undelegate
	 * @parent u.event.static
	 * @signature `obj.undelegate( selector, event, handler )`
	 *
	 * Provides a compatibility layer for removing delegate event listeners.
	 * This doesn't actually implement delegates, but rather allows 
	 * logic that assumes a delegate to still function.
	 *
	 * Therefore, this is essentially an alias of [u.event.removeEvent removeEvent] with the selector ignored.
	 *
	 * @param {String} selector The **ignored** selector to use for the delegate.
	 * @param {String} event The name of the event to listen for.
	 * @param {Function} handler The handler that will be executed to handle the event.
	 * @return {Object} this
	 *
	 * @signature `u.event.undelegate.call( obj, selector, event, handler )`
	 *
	 * This syntax u be used for objects that don't include the `u.event` mixin.
	 */
	undelegate: function(selector, event, handler) {
		return u.removeEvent.call(this, event, handler);
	},
	/**
	 * @function u.event.trigger
	 * @parent u.event.static
	 * @signature `obj.trigger( event, args )`
	 *
	 * Dispatches/triggers a basic event on an object.
	 * This is an alias of [u.event.dispatch dispatch].
	 *
	 * @signature `u.event.trigger.call( obj, event, args )`
	 *
	 * This syntax u be used for objects that don't include the `u.event` mixin.
	 */
	trigger: u.dispatch,

	// Normal u/event methods
	one: u.one,
	addEvent: u.addEvent,
	removeEvent: u.removeEvent,
	listenTo: u.listenTo,
	stopListening: u.stopListening,
	dispatch: u.dispatch
};

module.exports = u.event;

