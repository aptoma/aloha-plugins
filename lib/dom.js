/*global GENTICS*/
define(function (require) {
	'use strict';

	/**
	 * Module dependencies.
	 */
	var Aloha = require('aloha'),
		$ = require('jquery');

	return {

		/**
		 * Cleanup elements found in the given range.
		 *
		 * @param {Function} callback
		 * @return {Boolean}
		 */
		elementCleanup: function (callback) {
			var treeModified = false,
				range = Aloha.Selection.getRangeObject();

			if (!range.getCommonAncestorContainer()) {
				return false;
			}

			$.each(Aloha.Selection.getSelectionTree(range), function (idx, obj) {
				var el = obj.domobj;

				// must be fully contained in the selection
				if (obj.selection === 'full') {

					// get parent node if element is a text node
					if (el.nodeType === 3 && el.parentNode) {
						el = el.parentNode;
					}

					// run provided callback for element modification
					callback(el);

					// unwrap the span element if no other attributes are used
					if (el.nodeName.toLowerCase() === 'span' && !el.attributes.length) {
						GENTICS.Utils.Dom.removeFromDOM(el, range, true);

                        // update modified range
                        range.select();

						treeModified = true;
					}
				}
			});

			return treeModified;
		},

		/**
		 * Recursively cleanup elements found in the given range until the DOM no longer was modified.
		 *
		 * @param {Function} callback
		 * @param {Number} [iterationCount]
		 */
		recursiveElementCleanup: function (callback, iterationCount) {
			iterationCount = iterationCount || 0;
			if (this.elementCleanup(callback) && iterationCount < 10) {
				this.recursiveElementCleanup(callback, iterationCount);
				iterationCount++;
			}
		}
	};
});
