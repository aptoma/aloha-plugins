define(function (require) {
	'use strict';

	/**
	 * Module dependencies.
	 */
	var $ = require('jquery');

	return {

		/**
		 * Return the computed CSS style for an element.
		 * Note! this function will run camelCase function on the styleProp
		 *
		 * @param  {Element} el
		 * @param  {String} styleProp (camelCased or hyphenated syles)
		 * @return {String|Number}
		 */
		getComputedStyle: function (el, styleProp) {
			styleProp = $.camelCase(styleProp);
			if (el.currentStyle) {
				return el.currentStyle[styleProp];
			}
			if (window.getComputedStyle) {
				return document.defaultView.getComputedStyle(el, null)[styleProp];
			}
			return null;
		},

		/**
		 * Check if the given element has the given style.
		 *
		 * @param  {Element} element
		 * @param  {String} style (camelCased or hyphenated syles)
		 * @return {Boolean}
		 */
		hasStyle: function (element, style) {
			return Boolean(element.style[style]);
		},

		/**
		 * Remove the given style from the element and do cleanup.
		 *
		 * @param  {Element} el
		 * @param  {String} style
		 */
		removeStyle: function (el, style) {
			if (!$(el).css(style, '').attr('style')) {
				$(el).removeAttr('style');
			}
		},

		/**
		 * Remove the given classname from the element and do cleanup.
		 *
		 * @param  {Element} el
		 * @param  {String} className
		 */
		removeClass: function (el, className) {
			if (!$(el).removeClass(className).attr('class')) {
				$(el).removeAttr('class');
			}
		},

		/**
		 * Get CSS classnames on the given element.
		 *
		 * @param  {Element} el
		 * @return {Array}
		 */
		getClassNames: function (el) {
            return String($.trim($(el).attr('class'))).split(' ');
		},

		/**
		 * Get inline styles on the given element. If camelCased parameter is set
		 * property names will be converted from hyphenated to camelCased style.
		 *
		 * @param  {Element} el
		 * @param  {Boolean} [camelCased]
		 * @return {Object}
		 */
		getStyles: function (el, camelCased) {
			var styles = {},
				attr = $(el).attr('style');

			if (attr) {
				attr.split(';').forEach(function(s) {
					var style = $.trim(s).split(':');
					styles[camelCased ? $.camelCase(style[0]) : style[0]] = style[1];
				});
			}

			return styles;
		}
	};
});
