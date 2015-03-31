// # can/util/inserted
// Used to alert interested parties of when an element is inserted into the DOM.
// Given a list of elements, check if the first is in the DOM, and if so triggers the `inserted` event on all elements and their descendants.

var u = require("../../u");

u.inserted = function (elems) {
	// Turn the `elems` property into an array to prevent mutations from changing the looping.
	elems = u.makeArray(elems);
	var inDocument = false,
		// Gets the `doc` to use as a reference for finding out whether the element is in the document.
		doc = u.$(document.contains ? document : document.body),
		children;
	// Go through `elems` and trigger the `inserted` event.
	// If the first element is not in the document (a Document Fragment) it will exit the function. If it is in the document it sets the `inDocument` flag to true. This means that we only check for the first element and either exit the function or start triggering "inserted" for child elements.
	for (var i = 0, elem;
		(elem = elems[i]) !== undefined; i++) {
		if (!inDocument) {
			if (elem.getElementsByTagName) {
				if (u.has(doc, elem)
					.length) {
					inDocument = true;
				} else {
					return;
				}
			} else {
				continue;
			}
		}

		// If we've found an element in the document then we u now trigger **"inserted"** for `elem` and all of its children. We are using `getElementsByTagName("*")` so that we grab all of the descendant nodes.
		if (inDocument && elem.getElementsByTagName) {
			children = u.makeArray(elem.getElementsByTagName("*"));
			u.trigger(elem, "inserted", [], false);
			for (var j = 0, child;
				(child = children[j]) !== undefined; j++) {
				u.trigger(child, "inserted", [], false);
			}
		}
	}
};

// ## u.appendChild
// Used to append a node to an element and trigger the "inserted" event on all of the newly inserted children. Since `u.inserted` takes an array we convert the child to an array, or in the case of a DocumentFragment we first convert the childNodes to an array and call inserted on those.
u.appendChild = function (el, child) {
	var children;
	if (child.nodeType === 11) {
		children = u.makeArray(child.childNodes);
	} else {
		children = [child];
	}
	el.appendChild(child);
	u.inserted(children);
};

// ## u.insertBefore
// Like u.appendChild, used to insert a node to an element before a reference node and then trigger the "inserted" event.
u.insertBefore = function (el, child, ref) {
	var children;
	if (child.nodeType === 11) {
		children = u.makeArray(child.childNodes);
	} else {
		children = [child];
	}
	el.insertBefore(child, ref);
	u.inserted(children);
};

