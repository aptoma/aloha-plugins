define(function (require) {
	'use strict';

	/**
	 * Module dependencies.
	 */
	var Aloha = require('aloha');

	return {

		/**
		 * Selects the text from the given range.
		 *
		 * @param  {RangyRange} range
		 */
		selectTextFromRange: function (range) {
			var selection = Aloha.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
		}
	};
});
