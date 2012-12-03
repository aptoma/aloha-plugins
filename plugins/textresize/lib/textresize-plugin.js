define(function (require) {
	'use strict';

	/**
	 * Module dependencies.
	 */
	var Aloha = require('aloha'),
		Ui = require('ui/ui'),
		Button = require('ui/button'),
		PubSub = require('PubSub'),
		plugin = require('aloha/plugin'),
		Dom = require('../../../lib/dom'),
		Css = require('../../../lib/css'),
		Selection = require('../../../lib/selection'),
		Range = require('../../../lib/range'),
		Style = require('../../../lib/style'),
		$ = require('jquery');

	/**
	 * Plugin CSS dependencies.
	 */
	require('css!textresize/css/textresize');

	/**
	 * Return object keys.
	 *
	 * @param  {Object} obj
	 * @return {Array}
	 */
	function keys(obj) {
		var a = [];
		$.each(obj, function (k) {
			a.push(k);
		});
		return a;
	}

	/**
	 * Store a reference to the original publish method.
	 *
	 * @type {Function}
	 */
	var origPub = PubSub.pub;

	/**
	 * This method is needed to avoid triggering the "aloha.selection.context-change" while holding down a keyboard
	 * shortcut key for resizing the text. Many plugins listening on that event so without this fix, things be very
	 * slow since the event will trigger very rapidly when resizing.
	 *
	 * @param {String} channel
	 * @param {*} message
	 * @return {Number}
	 */
	function overloadPubSubPublish(channel, message) {
		if (channel !== 'aloha.selection.context-change') {
			return origPub.call(PubSub, channel, message);
		}
	}

	/**
	 * This method is needed to avoid triggering the "aloha.selection.context-change" while holding down a keyboard
	 * shortcut key for resizing the text. Many plugins listening on that event so without this fix, things be very
	 * slow since the event will trigger very rapidly when resizing.
	 *
	 * @param  {Boolean} active
	 */
	function filterPubSubEvents(active) {
		PubSub.pub = active ? overloadPubSubPublish : origPub;
	}

	/**
	 * Fix floating point number problems when doing calculations.
	 *
	 * @param  {Number} num
	 * @return {Number}
	 */
	function floatFix(num) {
		return parseFloat(num.toFixed(10));
	}

	/**
	 * Create & register the plugin.
	 */
	return plugin.create('textresize', {

		/**
		 * Buttons elements.
		 *
		 * @type {Object}
		 */
		buttons: {},

		/**
		 * Spinner elements.
		 *
		 * @type {Object}
		 */
		spinners: {},

		/**
		 * List of CssClassApplier instances (one per style).
		 *
		 * @type {Object}
		 */
		cssClassAppliers: {},

		/**
		 * Config for the spinners (key in camelCased style).
		 *
		 * unit = Unit to use when applying the value
		 * step = Size of the step to take when changing values
		 * page = Number of steps to take when paging (pageUp/pageDown or shift key)
		 * min = Minimum allowed value
		 * max = Maximum allowed value
		 * value = Initial and default value
		 *
		 * @type {Object}
		 */
		config: {
			fontSize: {
				unit: 'px',
				step: 1,
				page: 10,
				min: 10,
				max: 128,
				value: 16
			},
			lineHeight: {
				unit: 'em',
				step: 0.1,
				page: 10,
				min: 0,
				max: 3,
				value: 1.2
			},
			letterSpacing: {
				unit: 'em',
				step: 0.1,
				page: 10,
				min: -1,
				max: 3,
				value: 0
			},
			wordSpacing: {
				unit: 'em',
				step: 0.1,
				page: 10,
				min: -1,
				max: 2,
				value: 0
			}
		},

		/**
		 * HotKeys used for special actions.
		 */
		hotKey: {
			decreaseFontSize: 'ctrl+left ctrl+shift+left',
			increaseFontSize: 'ctrl+right ctrl+shift+right',
			decreaseLineHeight: 'ctrl+up ctrl+shift+up',
			increaseLineHeight: 'ctrl+down ctrl+shift+down'
		},

		/**
		 * Executed on plugin initialization.
		 */
		init: function () {
			var self = this;

			// iterate over all different styles
			$.each(this.config, function (key) {

				// merge user config with default
				if (self.settings.config && self.settings.config[key]) {
					$.extend(self.config[key], self.settings.config[key]);
				}

				// create button
				self.buttons[key] = Ui.adopt(key, Button, {
					'class': 'aloha-plugin-textresize-button'
				});

				$(self.buttons[key].element).attr('title', 'Change text ' + key.toLowerCase());

				self.cssClassAppliers[key] = Css.createClassApplier(self.getStyleClass(key));

				// create spinner for the style
				self.createSpinner(
					key,
					self.config[key],
					self['change' + key.substr(0,1).toUpperCase() + key.substr(1)]
				);
			});

			this.subscribeEvents();
		},

		/**
		 * Subscribe for events.
		 */
		subscribeEvents: function () {
			var self = this;

			PubSub.sub('aloha.selection.context-change', function (message) {
				if (Aloha.activeEditable) {
					self.onSelectionChanged(message.range);
				}
			});

			Aloha.bind('aloha-editable-activated', function (e, params) {
				if (Aloha.activeEditable) {
					$.each(self.hotKey, function (fn, keyCombo) {
						params.editable.obj.bind('keydown', keyCombo, function (e) {
							filterPubSubEvents(true);
							self[fn](e);
							return false;
						});
						params.editable.obj.bind('keyup', keyCombo, function (e) {
							filterPubSubEvents(false);
							return false;
						});
					});
				}
			});
		},

		/**
		 * Create the jQuery UI spinner.
		 * - http://api.jqueryui.com/spinner/
		 *
		 * @param  {String}   name
		 * @param  {Object}   options
		 * @param  {Function} cb
		 */
		createSpinner: function (name, options, cb) {
			var self = this,
				$input = $('<input class="aloha-plugin-textresize-spinner">').appendTo(
					$(this.buttons[name].element)
				);

			// TODO: why doesn't it work changing values with the mousewheel?
			this.spinners[name] = $input.spinner($.extend({}, options, {
				stop: function () {
					cb.call(self, $(this).val());
				}
			})).keyup(function () {
				// prevent losing focus when using up/down arrow keys in text input field
				$(this).focus();

				var val = parseFloat($(this).val());
				// prevent min/max boundary when entering values manually
				if (val < self.config[name].min || val > self.config[name].max) {
					return false;
				}
			});

			$input.spinner('value', this.config[name].value).spinner('widget').css('height', '24px');
		},

		/**
		 * Will be called every time the context of the selection changes.
		 *
		 * @param  {GENTICS.Utils.RangeObject} range
		 */
		onSelectionChanged: function (range) {
			var self = this;

			$.each(this.getStyles(range), function (style, value) {
				if (self.spinners[style]) {
					self.spinners[style].val(value);
				}
			});
		},

		/**
		 * Get the given style of current selection or cursor position.
		 *
		 * @param  {String} style
		 * @param  {Number} defaultValue
		 * @return {Number}
		 */
		getCurrentStyle: function (style, defaultValue) {
			var self = this,
				range = Aloha.Selection.getRangeObject(),
				styleValueRegex = new RegExp('([0-9\\-\\.]+)' + this.config[style].unit),
				match;

			var element = range.findMarkup(function () {
				return Style.hasStyle(this, style);
			}, Aloha.activeEditable.obj);

			if (!element) {
				element = range.getCommonAncestorContainer();
			}

			if (!element) {
				return defaultValue;
			}

			// check style set on element
			match = element.style[style].match(styleValueRegex);
			if (match) {
				return parseFloat(match[1]);
			}

			// fallback to computed style for element
			// TODO: convert px to em for line-height?
			match = Style.getComputedStyle($(element).get(0), style).match(styleValueRegex);
			if (match) {
				return parseFloat(match[1]);
			}

			return defaultValue;
		},

		/**
		 * Get values for a styles.
		 *
		 * @param  {GENTICS.Utils.RangeObject} range
		 * @return {Object}
		 */
		getStyles: function (range) {
			var self = this,
				styles = {};

			$.each(this.config, function (style, config) {
				var value = self.getCurrentStyle(style);
				if (value) {
					styles[style] = value;
				}
			});

			return styles;
		},

		/**
		 * Return a classname for the given style (used temporary in the changeStyle method).
		 *
		 * @param  {String} style
		 * @return {String}
		 */
		getStyleClass: function (style) {
			return 'tmpStyleClass' + style;
		},

		/**
		 * Change the style for the selection / cursor target.
		 *
		 * @param  {Object} attr
		 */
		changeStyle: function (attr) {
			var self = this;

			// remove previous styles in the selection
			Dom.elementCleanup(function (el) {
				$.each(attr, function (style) {
					Style.removeStyle(el, style);
				});
			});

			// iterate over each style and apply it to the selection
			$.each(attr, function (style, value) {
				var range = Aloha.Selection.getRangeObject(),
					styleClass = self.getStyleClass(style),
					rangyRange = range.isCollapsed() ? Range.createExpandedRangeFromCollapsed(range) :
						Range.rangeObjectToRangyRange(range);

				if (rangyRange) {
					self.cssClassAppliers[style].applyToRange(rangyRange);
					Selection.selectTextFromRange(rangyRange);
				}

				// convert temporary class to inline style (tempfix until Rangy has a proper way to set style attribute)
				var $classElement = $('.' + styleClass, Aloha.activeEditable.obj);
				if (!$classElement.css(style, value).removeClass(styleClass).attr('class')) {
					// $classElement.removeAttr('class');
					// TODO: the cssClassApplier seems to remove other classes when remove the entire class attribute
				}
			});
		},

		/**
		 * Change the font-size value of the active selection.
		 *
		 * @param  {Number} value
		 */
		changeFontSize: function (value) {
			if (value >= this.config.fontSize.min && value <= this.config.fontSize.max) {
				this.changeStyle({
					fontSize: value + this.config.fontSize.unit,
					lineHeight: ''
				});
				this.spinners.fontSize.val(value);
				this.spinners.lineHeight.val(this.config.lineHeight.value);
			}
		},

		/**
		 * Change the line-height value of the active selection.
		 *
		 * @param  {Number} value
		 */
		changeLineHeight: function (value) {
			if (value >= this.config.lineHeight.min && value <= this.config.lineHeight.max) {
				this.changeStyle({
					lineHeight: value + this.config.lineHeight.unit
				});
			}
			this.spinners.lineHeight.val(value);
		},

		/**
		 * Change the letter-spacing value of the active selection.
		 *
		 * @param  {Number} value
		 */
		changeLetterSpacing: function (value) {
			if (value >= this.config.letterSpacing.min && value <= this.config.letterSpacing.max) {
				this.changeStyle({
					letterSpacing: value + this.config.letterSpacing.unit
				});
				this.spinners.letterSpacing.val(value);
			}
		},

		/**
		 * Change the word-spacing value of the active selection.
		 *
		 * @param  {Number} value
		 */
		changeWordSpacing: function (value) {
			if (value >= this.config.wordSpacing.min && value <= this.config.wordSpacing.max) {
				this.changeStyle({
					wordSpacing: value + this.config.wordSpacing.unit
				});
				this.spinners.wordSpacing.val(value);
			}
		},

		/**
		 * Decrease the font-size one step.
		 *
		 * @param {jQuery.Event} e
		 */
		decreaseFontSize: function (e) {
			var step = this.config.fontSize.step;

			if (e.shiftKey) {
				step = step * this.config.fontSize.page;
			}

			this.changeFontSize(
				floatFix(this.getCurrentStyle('fontSize', this.config.fontSize.value) - step)
			);
		},

		/**
		 * Increase the font-size one step.
		 *
		 * @param {jQuery.Event} e
		 */
		increaseFontSize: function (e) {
			var step = this.config.fontSize.step;

			if (e.shiftKey) {
				step = step * this.config.fontSize.page;
			}

			this.changeFontSize(
				floatFix(this.getCurrentStyle('fontSize', this.config.fontSize.value) + step)
			);
		},

		/**
		 * Decrease the line-height one step.
		 *
		 * @param {jQuery.Event} e
		 */
		decreaseLineHeight: function (e) {
			var step = this.config.lineHeight.step;

			if (e.shiftKey) {
				step = step * this.config.lineHeight.page;
			}

			this.changeLineHeight(
				floatFix(this.getCurrentStyle('lineHeight', this.config.lineHeight.value) - step)
			);
		},

		/**
		 * Increase the line-height one step.
		 *
		 * @param {jQuery.Event} e
		 */
		increaseLineHeight: function (e) {
			var step = this.config.lineHeight.step;

			if (e.shiftKey) {
				step = step * this.config.lineHeight.page;
			}

			this.changeLineHeight(
				floatFix(this.getCurrentStyle('lineHeight', this.config.lineHeight.value) + step)
			);
		}

	});

});
