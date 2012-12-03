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
		Css = require('../../../lib/css'),
		Dom = require('../../../lib/dom'),
		Style = require('../../../lib/style'),
		Selection = require('../../../lib/selection'),
		$ = require('jquery');

	/**
	 * Plugin CSS dependencies.
	 */
	require('css!font/css/styles');

	/**
	 * Create & register the plugin.
	 */
	return plugin.create('font', {

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
			 * A list of font classes. If object, the key will be used as the title for the
			 * font in the menu. If array, it will use the actual font name used by the class.
			 *
			 * @type {Object|Array}
			 */
			classes: []
		},

		/**
		 * Executed on plugin initialization.
		 */
		init: function () {
			var self = this,
				menuItems = [];

			// merge user settings with the defaults
			this.settings = $.extend(true, this.defaults, this.settings);

			$.each(this.settings.classes, function (key, className) {
				self.cssClassAppliers[className] = Css.createClassApplier(className);

				menuItems.push({
					'class': className,
					text: (typeof key === 'string' ? key : '{font-family}'),
					iconUrl: Aloha.getPluginUrl('font') + '/img/tick.png',
					click: function () {
						self.toggleClassName(className);
						self.updateButtonTitle();
					}
				});
			});

			this.menuButton = Ui.adopt("font", MenuButton, {
				text: 'Font',
				menu: menuItems,
				onShow: $.proxy(this.onMenuShow, this)
			});

			$(this.menuButton.element)
				.addClass('aloha-plugin-font')
				.attr('title', 'Toggle font');

			PubSub.sub('aloha.selection.context-change', function(message) {
				self.onSelectionChanged(message.range);
			});
		},

		/**
		 * Will be called every time the context of the selection changes.
		 *
		 * @param  {GENTICS.Utils.RangeObject} range
		 */
		onSelectionChanged: function (range) {
			this.updateButtonTitle();
		},

		/**
		 * Update the text on the button with the active font.
		 */
		updateButtonTitle: function () {
			$('.ui-button-text', this.menuButton.element).text(this.getTitleFromActiveFont());
		},

		/**
		 * Will be called when the user clicks on the menu.
		 */
		onMenuShow: function () {
			this.updateMenuItems();
		},

		/**
		 * Get the title from the current selection.
		 *
		 * @return {String}
		 */
		getTitleFromActiveFont: function () {
			var title = 'Font',
				range = Aloha.Selection.getRangeObject(),
				el = range.getCommonAncestorContainer();

			if ($.isArray(this.settings.classes)) {
				// if we don't have a title
				var computedFontFamily = Style.getComputedStyle(el, 'font-family');
				if (computedFontFamily) {
					title = computedFontFamily;
				}
			} else {
				// look at the active font class
				var classNames = Style.getClassNames(el);
				$.each(this.settings.classes, function (key, className) {
					if (classNames.indexOf(className) >= 0) {
						title = key;
						return;
					}
				});
			}

			return title;
		},

		/**
		 * Update the menu and with the active font and update and computed
		 * font names automatically if it wasn't specified from the settings.
		 */
		updateMenuItems: function () {
			var title = this.getTitleFromActiveFont();

			$('.ui-menu-item', this.menuButton.element).each(function (idx, el) {
				var $a = $('a', el);

				if ($a.text() === '{font-family}') {
					$a.contents().last()[0].textContent = Style.getComputedStyle(el, 'font-family');
				}

				$('.aloha-ui-inline-icon', this).css(
					'visibility', $a.text() === title ? 'visible' : 'hidden'
				);
			});
		},

		/**
		 * Toggle the given classname on the current selection.
		 *
		 * @param  {String} className
		 */
		toggleClassName: function (className) {
			var self = this,
				range = Aloha.Selection.getRangeObject(),
				rangyRange;

			if (range.isCollapsed()) {
				rangyRange = Range.createExpandedRangeFromCollapsed(range);
				Selection.selectTextFromRange(rangyRange);
			} else {
				rangyRange = Range.rangeObjectToRangyRange(range);
			}

			// remove other font classes before toggling the given one
			Dom.elementCleanup(function (el) {
				$.each(Style.getClassNames(el), function (idx, otherClassName) {
					if (className !== otherClassName && self.settings.classes.indexOf(otherClassName) >= 0) {
						$(el).removeClass(otherClassName);
					}
				});
			});

			this.cssClassAppliers[className].toggleRange(rangyRange);
		}
	});
});
