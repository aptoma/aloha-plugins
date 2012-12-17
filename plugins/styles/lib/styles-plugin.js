define(function (require) {
	'use strict';

	/**
	 * Module dependencies.
	 */
	var Aloha = require('aloha'),
		Ui = require('ui/ui'),
		Button = require('ui/button'),
		MenuButton = require('../../../lib/ui/menuButton'),
		PubSub = require('PubSub'),
		plugin = require('aloha/plugin'),
		Range = require('../../../lib/range'),
		Dom = require('../../../lib/dom'),
		Css = require('../../../lib/css'),
		Style = require('../../../lib/style'),
		Selection = require('../../../lib/selection'),
		$ = require('jquery');

	/**
	 * Plugin CSS dependencies.
	 */
	require('css!styles/css/styles');

	/**
	 * Create & register the plugin.
	 */
	return plugin.create('styles', {

		/**
		 * Will contain a list of the matching selectors from
		 * this.settings.classes for the active selection.
		 *
		 * @type {Array}
		 */
		selectionSelectorsMatched: [],

		/**
		 * List of CssClassApplier instances (one per class).
		 *
		 * @type {Object}
		 */
		cssClassAppliers: {},

		/**
		 * Default settings.
		 *
		 * @type {Object}
		 */
		defaults: {
			/**
			 * A list of classes where the key is a CSS selector which will determine if the
			 * class should be available in the menu for the current selection in the editor.
			 *
			 * classes: {
			 *   '*': ['fancy', 'cool'],
			 *   'h1': ['awesome']
			 * }
			 *
			 * @type {Object[]}
			 */
			classes: {}
		},

		/**
		 * Executed on plugin initialization.
		 */
		init: function () {
			var self = this;

			// merge user settings with the defaults
			this.settings = $.extend(true, this.defaults, this.settings);

			this.createMenu();

			PubSub.sub('aloha.selection.context-change', function (message) {
				self.onSelectionChanged(message.range);
			});
		},

		/**
		 * Reset states and the menu (used when updating an existing menu).
		 */
		reset: function () {
			this.selectionSelectorsMatched = [];
			this.cssClassAppliers = {};

			// TODO: find a way to do it properly in Aloha
			if (this.menuButton) {
				this.menuButton.element.remove();
			}
		},

		/**
		 * Creates the dropdown menu and populates it with classes.
		 */
		createMenu: function () {
			var self = this,
				menuItems = [];

			$.each(this.settings.classes, function (idx, classes) {
				$.each(classes, function (title, className) {

					self.cssClassAppliers[className] = Css.createClassApplier(className);

					menuItems.push({
						text: title,
						iconUrl: Aloha.getPluginUrl('styles') + '/img/tick.png',
						click: function () {
							self.toggleClassName(className);
							self.updateMenuItems();
							return false;
						}
					});
				});
			});

			this.menuButton = Ui.adopt("styles", MenuButton, {
				tooltip: 'Toggle CSS classes',
				menu: menuItems,
				onShow: $.proxy(this.onMenuShow, this),
				iconUrl: Aloha.getPluginUrl('styles') + '/img/button.png'
			});

			$(this.menuButton.element).addClass('aloha-plugin-styles');
		},

		/**
		 * Get the matching selectors for the given element.
		 *
		 * @param {Element} el
		 * @return {Array}
		 */
		getMatchingSelectors: function (el) {
			return $.map(Object.keys(this.settings.classes), function (selector) {
				return $(el).is(selector) ? selector : null;
			});
		},

		/**
		 * Get a list of classes that are used on the active selection.
		 *
		 * @return {Array}
		 */
		getActiveClasses: function () {
			var range = Aloha.Selection.getRangeObject(),
				el = range.getCommonAncestorContainer();

			return Style.getClassNames(el);
		},

		/**
		 * Get the style name from the given class name.
		 *
		 * @param  {String} className
		 * @return {String}
		 */
		getStyleNameByClass: function (className) {
			var name = null;

			$.each(this.settings.classes, function (idx, classes) {
				$.each(classes, function (title, klassName) {
					if (className === klassName) {
						name = title;
					}
				});
			});

			return name;
		},

		/**
		 * Will be called every time the context of the selection changes.
		 *
		 * @param  {GENTICS.Utils.RangeObject} range
		 */
		onSelectionChanged: function (range) {
			var self = this,
				selectorsMatched = [];

			// iterate over the markup elements and check if any of them match our class selector(s)
			$.each(range.markupEffectiveAtStart, function (idx, markup) {
				$.merge(selectorsMatched, self.getMatchingSelectors(markup));
			});

			this.selectionSelectorsMatched = $.unique(selectorsMatched);
		},

		/**
		 * Will be called when the user clicks on the menu.
		 */
		onMenuShow: function () {
			this.updateMenuItems();
		},

		/**
		 * Update the menu and filter out classes that shouldn't be displayed.
		 */
		updateMenuItems: function () {
			var self = this,
				availableStyleNames = [],
				activeStyleNames = [],
				activeClasses = this.getActiveClasses();

			// get a list of class titles to be displayed
			$.each(this.selectionSelectorsMatched, function (idx, selector) {
				$.merge(availableStyleNames, Object.keys(self.settings.classes[selector]));
			});

			$.each(activeClasses, function (idx, className) {
				activeStyleNames.push(self.getStyleNameByClass(className));
			});

			// disable items not in class list and show which classes that are active
			$('.ui-menu-item', this.menuButton.element).each(function () {
				var name = $('a', this).text();

				$(this).toggleClass('ui-state-disabled', availableStyleNames.indexOf(name) < 0);

				$('.aloha-ui-inline-icon', this).css(
					'visibility', activeStyleNames.indexOf(name) < 0 ? 'hidden' : 'visible'
				);
			});
		},

		/**
		 * Toggle the given classname on the current selection.
		 *
		 * @param  {String} className
		 */
		toggleClassName: function (className) {
			var range = Aloha.Selection.getRangeObject();

			if (range.isCollapsed()) {
				var rangyRange = Range.createExpandedRangeFromCollapsed(range);
				if (rangyRange) {
					Selection.selectTextFromRange(rangyRange);
					this.cssClassAppliers[className].toggleRange(rangyRange);
				}
			} else {
				this.cssClassAppliers[className].toggleSelection();
			}
		},

		/**
		 * Update styles in the menu.
		 * @param  {Object} classes
		 */
		updateStyleClasses: function (classes) {
			this.reset();
			this.settings.classes = classes;
			this.createMenu();
		}
	});
});