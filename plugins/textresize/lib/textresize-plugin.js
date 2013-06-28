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
		Dom = require('aptoma/lib/dom'),
		Css = require('aptoma/lib/css'),
		Selection = require('aptoma/lib/selection'),
		Range = require('aptoma/lib/range'),
		Style = require('aptoma/lib/style'),
		$ = require('jquery'),
		GENTICS = window.GENTICS;

	/**
	 * Returns a function, that, as long as it continues to be invoked, will not
	 * be triggered. The function will be called after it stops being called for
	 * N milliseconds. If `immediate` is passed, trigger the function on the
	 * leading edge, instead of the trailing.
	 * @param {Function} func
	 * @param {Number} wait
	 * @param {Boolean} immediate
	 * @return {Function}
	 */
	function debounce(func, wait, immediate) {
		var timeout, result;
		return function () {
			var context = this, args = arguments;
			var later = function () {
				timeout = null;
				if (!immediate) {
					result = func.apply(context, args);
				}
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) {
				result = func.apply(context, args);
			}
			return result;
		};
	}

	/**
	 * Store a reference to the original publish method.
	 * @type {Function}
	 */
	var origPub = PubSub.pub;

	/**
	 * Indicates if the keyboard shortcut is hold down (pressed).
	 * @type {Boolean}
	 */
	var keyDownRepeat = false;

	/**
	 * This method is needed to avoid triggering the "aloha.selection.context-change" while holding down a keyboard
	 * shortcut key for resizing the text. Many plugins listening on that event so without this fix, things be very
	 * slow since the event will trigger very rapidly when resizing.
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
	 * @param  {Boolean} active
	 */
	function filterPubSubEvents(active) {
		PubSub.pub = active ? overloadPubSubPublish : origPub;
	}

	/**
	 * Fix floating point number problems when doing calculations.
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
		 * @type {Object}
		 */
		buttons: {},

		/**
		 * Spinner elements.
		 * @type {Object}
		 */
		spinners: {},

		/**
		 * List of CssClassApplier instances (one per style).
		 * @type {Object}
		 */
		cssClassAppliers: {},

		/**
		 * Config for the spinners (key in camelCased style).
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
			autoFit: {
				margin: 0
			},
			fontSize: {
				unit: 'px',
				className: null,
				step: 1,
				page: 10,
				min: 10,
				max: 128,
				value: 16
			},
			lineHeight: {
				unit: 'em',
				className: null,
				step: 0.1,
				page: 10,
				min: 0,
				max: 3,
				value: 1.2
			},
			letterSpacing: {
				unit: 'em',
				className: null,
				step: 0.1,
				page: 10,
				min: -1,
				max: 3,
				value: 0
			},
			wordSpacing: {
				unit: 'em',
				className: null,
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
			increaseLineHeight: 'ctrl+down ctrl+shift+down',
			autofitFontSize: 'alt+space'
		},

		/**
		 * Executed on plugin initialization.
		 */
		init: function () {
			var self = this;

			// merge user config with default
			$.each(this.config, function (key) {
				if (self.settings.config && self.settings.config[key]) {
					$.extend(self.config[key], self.settings.config[key]);
				}
			});

			// iterate over all different styles
			$.each(['fontSize', 'lineHeight', 'letterSpacing', 'wordSpacing'], function (idx, key) {

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
					self['change' + key.substr(0, 1).toUpperCase() + key.substr(1)]
				);
			});

			this.subscribeEvents();

			// Use same delay as Aloha.activeEditable.sccDelay
			this.debouncedTriggerSmartContentChange = debounce(this.triggerSmartContentChange, 500);
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
				$.each(self.hotKey, function (fn, keyCombo) {
					params.editable.obj.bind('keydown.aloha.textresize', keyCombo, function (e) {
						filterPubSubEvents(true);
						self[fn](e);
						keyDownRepeat = true;
						return false;
					});

					params.editable.obj.bind('keyup.aloha.textresize', keyCombo, function () {
						keyDownRepeat = false;
						filterPubSubEvents(false);
						self.triggerSmartContentChange();
					});
				});
			});

			Aloha.bind('aloha-editable-deactivated', function (e, params) {
				params.editable.obj.unbind('.aloha.textresize');
			});
		},

		/**
		 * Create the jQuery UI spinner.
		 * - http://api.jqueryui.com/spinner/
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
		 * Get the current value from the given style (or class) of the current selection or cursor position.
		 * @param  {String} style
		 * @param  {Number} defaultValue
		 * @return {Number}
		 */
		getCurrentValue: function (style, defaultValue) {
			var range = Aloha.Selection.getRangeObject(),
				styleValueRegex = new RegExp('([0-9\\-\\.]+)' + this.config[style].unit),
				needle,
				match;

			if (this.config[style].className) {
				needle = this.config[style].className.replace('{value}', '');
			}

			var element = range.findMarkup(function () {
				return Style.hasStyle(this, style) || (needle && this.className.indexOf(needle) >= 0);
			}, Aloha.activeEditable.obj);

			if (!element) {
				element = range.getCommonAncestorContainer();
			}

			if (!element) {
				return defaultValue;
			}

			// get current value from classname
			if (this.config[style].className) {
				match = element.className.match(new RegExp(this.config[style].className.replace('{value}', '(\\d+)')));
				if (match) {
					return parseInt(match[1], 10);
				}
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
		 * @param  {GENTICS.Utils.RangeObject} range
		 * @return {Object}
		 */
		getStyles: function () {
			var self = this,
				styles = {};

			$.each(['fontSize', 'lineHeight', 'letterSpacing', 'wordSpacing'], function (idx, style) {
				var value = self.getCurrentValue(style);
				if (value) {
					styles[style] = value;
				}
			});

			return styles;
		},

		/**
		 * Return a classname for the given style (used temporary in the changeStyle method).
		 * @param  {String} style
		 * @return {String}
		 */
		getStyleClass: function (style) {
			return 'tmpStyleClass' + style;
		},

		/**
		 * Change the style for the selection / cursor target.
		 * @param  {String} name
		 * @param  {String} value
		 */
		changeStyle: function (name, value) {
			var self = this;

			// only run the initial cleanup and selection stuff one time when holding down a keyboard
			// shortcut for resizing (no need to run it more since the selection won't change)
			if (!keyDownRepeat) {
				// remove previous styles in the selection
				Dom.elementCleanup(function (el) {
					Style.removeStyle(el, name);
				});

				// apply style to the selection
				var range = Aloha.Selection.getRangeObject(),
					styleClass = self.getStyleClass(name),
					rangyRange = range.isCollapsed() ? Range.createExpandedRangeFromCollapsed(range) :
						Range.rangeObjectToRangyRange(range);

				if (rangyRange) {
					self.cssClassAppliers[name].applyToRange(rangyRange);
					Selection.selectTextFromRange(rangyRange);
				}

				// convert temporary class to inline style (tempfix until Rangy has a proper way to set style attribute)
				var $classElement = $('.' + styleClass, Aloha.activeEditable.obj);
				if (!$classElement.css(name, value).removeClass(styleClass).attr('class')) {
					// $classElement.removeAttr('class');
					// TODO: the cssClassApplier seems to remove other classes when remove the entire class attribute
				}
			} else {
				$(Aloha.Selection.getRangeObject().getCommonAncestorContainer()).css(name, value);
			}

			this.debouncedTriggerSmartContentChange();
		},

		/**
		 * Change the class for the selection / cursor target.
		 * @param  {String} name
		 * @param  {String} value
		 */
		changeClass: function (name, value) {
			var self = this,
				template = this.config[name].className,
				needle = template.replace('{value}', ''),
				className = template.replace('{value}', value);

			// only run the initial cleanup and selection stuff one time when holding down a keyboard
			// shortcut for resizing (no need to run it more since the selection won't change)
			if (!keyDownRepeat) {
				// remove previous styles & classes in the selection
				Dom.elementCleanup(function (el) {
					self.replaceClass($(el), needle);
					Style.removeStyle(el, name);
				});

				// apply classes to the to the selection
				var range = Aloha.Selection.getRangeObject(),
					cssClassApplier = Css.createClassApplier(className),
					rangyRange = range.isCollapsed() ? Range.createExpandedRangeFromCollapsed(range) :
						Range.rangeObjectToRangyRange(range);

				if (rangyRange) {
					cssClassApplier.applyToRange(rangyRange);
					Selection.selectTextFromRange(rangyRange);
				}
			} else {
				this.replaceClass($(Aloha.Selection.getRangeObject().getCommonAncestorContainer()), needle, className);
			}

			this.debouncedTriggerSmartContentChange();
		},

		/**
		 * Replace all classes matching the given `needle` with the new class `newClassName`.
		 * @param  {jQuery.Element} $el
		 * @param  {String} needle
		 * @param  {String} [newClassName]
		 */
		replaceClass: function ($el, needle, newClassName) {
			if ($el.attr('class')) {
				$.each($el.attr('class').split(' '), function (idx, className) {
					if (className.indexOf(needle) >= 0) {
						$el.removeClass(className);
					}
				});
			}

			if (newClassName) {
				$el.addClass(newClassName);
			}
		},

		/**
		 * Trigger a aloha-smart-content-changed event. We should be able to use the
		 * Aloha.activeEditable.smartContentChange method but it seems to be a bit broken right now.
		 */
		triggerSmartContentChange: function () {
			var snapshot = null;

			// Since this function is delayed with 500ms the editor might have been deactivated while waiting
			if (!Aloha.activeEditable) {
				return;
			}

			function getSnapshotContent() {
				if (null === snapshot) {
					snapshot = Aloha.activeEditable.getSnapshotContent();
				}
				return snapshot;
			}

			Aloha.trigger('aloha-smart-content-changed', {
				'editable': Aloha.activeEditable,
				'keyIdentifier': null,
				'keyCode': null,
				'char': null,
				'triggerType': 'text-resize',
				'getSnapshotContent': getSnapshotContent
			});
		},

		/**
		 * Change style value (or class) for the given `name`.
		 * @param  {String} name
		 * @param  {Number} value
		 */
		changeValue: function (name, value) {
			if (value >= this.config[name].min && value <= this.config[name].max) {
				if (this.config[name].className) {
					this.changeClass(name, value);
				} else {
					this.changeStyle(name, value + this.config[name].unit);
				}

				this.spinners[name].val(value);
			}
		},

		/**
		 * Change the font-size value of the active selection.
		 * @param  {Number} value
		 */
		changeFontSize: function (value) {
			this.changeValue('fontSize', value);
		},

		/**
		 * Change the line-height value of the active selection.
		 * @param  {Number} value
		 */
		changeLineHeight: function (value) {
			this.changeValue('lineHeight', value);
		},

		/**
		 * Change the letter-spacing value of the active selection.
		 * @param  {Number} value
		 */
		changeLetterSpacing: function (value) {
			this.changeValue('letterSpacing', value);
		},

		/**
		 * Change the word-spacing value of the active selection.
		 * @param  {Number} value
		 */
		changeWordSpacing: function (value) {
			this.changeValue('wordSpacing', value);
		},

		/**
		 * Decrease the font-size one step.
		 * @param {jQuery.Event} e
		 */
		decreaseFontSize: function (e) {
			var step = this.config.fontSize.step;

			if (e.shiftKey) {
				step = step * this.config.fontSize.page;
			}

			this.changeFontSize(
				floatFix(this.getCurrentValue('fontSize', this.config.fontSize.value) - step)
			);
		},

		/**
		 * Increase the font-size one step.
		 * @param {jQuery.Event} e
		 */
		increaseFontSize: function (e) {
			var step = this.config.fontSize.step;

			if (e.shiftKey) {
				step = step * this.config.fontSize.page;
			}

			this.changeFontSize(
				floatFix(this.getCurrentValue('fontSize', this.config.fontSize.value) + step)
			);
		},

		/**
		 * Decrease the line-height one step.
		 * @param {jQuery.Event} e
		 */
		decreaseLineHeight: function (e) {
			var step = this.config.lineHeight.step;

			if (e.shiftKey) {
				step = step * this.config.lineHeight.page;
			}

			this.changeLineHeight(
				floatFix(this.getCurrentValue('lineHeight', this.config.lineHeight.value) - step)
			);
		},

		/**
		 * Increase the line-height one step.
		 * @param {jQuery.Event} e
		 */
		increaseLineHeight: function (e) {
			var step = this.config.lineHeight.step;

			if (e.shiftKey) {
				step = step * this.config.lineHeight.page;
			}

			this.changeLineHeight(
				floatFix(this.getCurrentValue('lineHeight', this.config.lineHeight.value) + step)
			);
		},

		/**
		 * Autofit the selected text to fit into the full width of the nearest block level element.
		 */
		autofitFontSize: function () {
			var range = Aloha.Selection.getRangeObject(),
				$parent = $(range.getCommonAncestorContainer()),
				fontSize = this.config.fontSize.min,
				maxWidth,
				origWhiteSpace,
				$el;

			// try to find the nearest block level element
			range.findMarkup(function () {
				if (GENTICS.Utils.Dom.isBlockLevelElement(this)) {
					$parent = $(this);
				}
			}, Aloha.activeEditable.obj);

			maxWidth = $parent.width();

			// always apply size one time to get a new range when text is selected and a new element is created
			keyDownRepeat = false;
			this.changeFontSize(fontSize);
			range = Aloha.Selection.getRangeObject();
			$el = $(range.getCommonAncestorContainer());

			// ensure the text doesn't wrap while we calculate width
			origWhiteSpace = $el.css('white-space');
			$el.css('white-space', 'nowrap');

			// makes changeFontSize() faster while looping ..
			keyDownRepeat = true;

			while ($el.width() <= maxWidth && ++fontSize <= this.config.fontSize.max) {
				this.changeFontSize(fontSize);
			}

			this.changeFontSize(--fontSize);

			if (this.config.autoFit.margin) {
				this.changeFontSize(fontSize - this.config.autoFit.margin);
			}

			$el.css('white-space', origWhiteSpace === 'normal' ? '' : origWhiteSpace);
			keyDownRepeat = false;
		}
	});
});
