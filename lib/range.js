define(function (require) {
	'use strict';

	/**
	 * Module dependencies.
	 */
	var Aloha = require('aloha'),
		rangy = require('aloha/rangy-core');

	return {

		/**
		 * Converts Aloha Range to core RangyRange.
		 *
		 * @param  {GENTICS.Utils.RangeObject} range
		 * @return {RangyRange}
		 */
		rangeObjectToRangyRange: function (range) {
			if (range.startOffset > range.startContainer.length) {
				console.warn('startOffset in range exceeds text length', range.startOffset, range.startContainer.length);
				return false;
			}

			if (range.endOffset > range.endContainer.length) {
				console.warn('endOffset in range exceeds text length', range.endOffset, range.endContainer.length);
				return false;
			}

			var rangyRange = rangy.createRange();
			rangyRange.setStart(range.startContainer, range.startOffset);
			rangyRange.setEnd(range.endContainer, range.endOffset);

			return rangyRange;
		},

		/**
		 * Create an expanded range from the entire text in the given range.
		 *
		 * @param {GENTICS.Utils.RangeObject} range
		 * @return {RangyRange}
		 */
		createExpandedRangeFromCollapsed: function (range) {
			if (typeof range.startContainer === 'undefined' || typeof range.endContainer === 'undefined') {
				console.warn('can not select an empty range');
				return false;
			}

			var newRange = Aloha.createRange();

			newRange.setStart(range.startContainer, 0);
			newRange.setEnd(range.endContainer, range.endContainer.length);

			return newRange;
		}
	};
});
