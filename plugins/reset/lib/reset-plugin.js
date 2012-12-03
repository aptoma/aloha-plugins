define(function (require) {
	'use strict';

	/**
	 * Module dependencies.
	 */
	var Aloha = require('aloha'),
		Ui = require('ui/ui'),
		Button = require('ui/button'),
		plugin = require('aloha/plugin'),
		Dom = require('../../../lib/dom'),
		Style = require('../../../lib/style'),
		$ = require('jquery');

	/**
	 * Create & register the plugin.
	 */
	return plugin.create('reset', {

		/**
		 * Default settings.
		 *
		 * @type {Object}
		 */
		defaults: {
			whitelist: {
				/**
				 * Classes to not remove.
				 *
				 * @type {Array}
				 */
				classes: [],

				/**
				 * Style property names to not remove (camelCased style).
				 *
				 * @type {Array}
				 */
				styles: []
			}
		},

		/**
		 * Executed on plugin initialization.
		 */
		init: function () {
			// merge user settings with the defaults
			this.settings = $.extend(true, this.defaults, this.settings);

			this.button = Ui.adopt('reset', Button, {
				tooltip: 'Remove classes & styles from selected text',
				iconUrl: Aloha.getPluginUrl('reset') + '/img/button.png',
				click: $.proxy(this.onButtonClick, this)
			});
		},

		/**
		 * Called when clicking the remove styling button.
		 */
		onButtonClick: function () {
			this.resetStyleForSelection();
		},

		/**
		 * Reset styling on the current selection.
		 */
		resetStyleForSelection: function () {
			var self = this,
				range = Aloha.Selection.getRangeObject();

			if (range.isCollapsed()) {
				return;
			}

			Dom.recursiveElementCleanup(function (el) {
				if ($(el).attr('class')) {
					$.each(Style.getClassNames(el), function (idx, className) {
						if (self.settings.whitelist.classes.indexOf(className) < 0) {
							Style.removeClass(el, className);
						}
					});
				} else {
					$(el).removeAttr('class');
				}

				if ($(el).attr('style')) {
					$.each(Style.getStyles(el, true), function (propertyName, value) {
						if (self.settings.whitelist.styles.indexOf(propertyName) < 0) {
							Style.removeStyle(el, propertyName);
						}
					});
				} else {
					$(el).removeAttr('style');
				}
			});
		}
	});
});
