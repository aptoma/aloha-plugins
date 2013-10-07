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
		$ = require('jquery'),
		Css = require('aptoma/lib/css'),
		Range = require('aptoma/lib/range'),
		Style = require('aptoma/lib/style');

	/**
	 * Load colorpicker jquery plugin
	 */
	require('./vendor/spectrum/spectrum');

	/**
	 * Create & register the plugin.
	 */
	return plugin.create('colorpicker', {
		tmpClassName: 'tmp-colorpicker-color',
		colorpickers: {},
		tooltips: {
			'foregroundColor': 'Change foreground color',
			'backgroundColor': 'Change background color'
		},
		typeStyle: {
			'foregroundColor': 'color',
			'backgroundColor': 'backgroundColor'
		},

		/**
		 * Executed on plugin initialization.
		 */
		init: function () {
			this.cssClassApplier = Css.createClassApplier(this.tmpClassName);
			this.createButtons();
			this.subscribeEvents();
		},

		/**
		 * Create aloha buttons and initials the colorpicker
		 */
		createButtons: function () {
			var self = this;
			$.each(['backgroundColor', 'foregroundColor'], function (idx, name) {
				var picker = {
					style: self.typeStyle[name],
					button: Ui.adopt(name, Button, {
						tooltip: self.tooltips[name],
						icon: 'cp-plugin-icon cp-plugin-icon-' + name
					})
				};
				picker.el = picker.button.element;
				picker.button.element.append($('<div class="cp-plugin-color-preview"/>'));

				self.colorpickers[name] = picker;

				var options = $.extend({
					show: function (color) {
						self.onShow(color, picker);
					},
					change: function (color) {
						self.onChangeColor(color, picker);
					},
					move: function (color) {
						self.updateColorOnSelection(color, picker);
					},
					hide: function (color) {
						self.onHide(color, picker);
					}
				}, self.settings);

				picker.el.spectrum(options);
				picker.el.spectrum('container').mousedown(function () {
					//prevents the editor to loose focus of its selection.
					return false;
				});
				self.updateColorPreview(picker.el.spectrum('get'), picker);
			});
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
		},

		/**
		 * Will be called every time the context of the selection changes.
		 *
		 * @param  {GENTICS.Utils.RangeObject} range
		 */
		onSelectionChanged: function (range) {
			var self = this;
			$.each(this.typeStyle, function (name, style) {
				var element = range.findMarkup(function () {
					return Style.hasStyle(this, style);
				}, Aloha.activeEditable.obj);

				if (!element) {
					element = range.getCommonAncestorContainer();
				}

				self.colorpickers[name].el.spectrum('set', Style.getComputedStyle(element, style));
				self.updateColorPreview(self.colorpickers[name].el.spectrum('get'), self.colorpickers[name]);
			});
		},

		/**
		 * Triggered when a new color has been selected
		 *
		 * @param  {Object} color
		 * @param  {Object} picker
		 */
		onChangeColor: function (color, picker) {
			picker.selectedColor = color;
			this.updateColorOnSelection(color, picker);
		},

		/**
		 * Triggered when the colorpicker is closed
		 * @param  {Object} color
		 * @param  {Object} picker
		 */
		onHide: function (color, picker) {
			this.updateColorOnSelection(picker.selectedColor, picker);
			picker.button.element.removeClass('aloha-button-active');
		},

		/**
		 * Update the color on the selection
		 * @param  {Object} color
		 * @param  {Object} picker
		 */
		updateColorOnSelection: function (color, picker) {
			var range = Aloha.Selection.getRangeObject();
			if (range.isCollapsed()) {
				this.cssClassApplier.applyToRange(Range.createExpandedRangeFromCollapsed(range));
			} else {
				this.cssClassApplier.applyToSelection();
			}

			if (color.alpha === 0 && picker.style === 'background-color') {
				//remove the style
				$('.' + this.tmpClassName).css(picker.style, '').removeClass(this.tmpClassName);
			} else {
				$('.' + this.tmpClassName).css(picker.style, color.toRgbString()).removeClass(this.tmpClassName);
			}

			this.updateColorPreview(color, picker);
		},

		/**
		 * Update the color preview on the button
		 * @param  {Object} color
		 * @param  {Object} picker
		 */
		updateColorPreview: function (color, picker) {
			$('.cp-plugin-color-preview', picker.button.element).css('background-color', color.toRgbString());
		},

		/**
		 * Triggered when the colorpicker is shown
		 * @param  {Object} color
		 * @param  {Object} picker
		 */
		onShow: function (color, picker) {
			picker.selectedColor = color;
			picker.button.element.addClass('aloha-button-active');
			//stop event bubbling so aloha dosnt lose focus.
			//fix specific positioning
			picker.el.spectrum('container')
				.unbind('click.colorpicker mousedown.colorpicker')
				.bind('click.colorpicker mousedown.colorpicker', function (e) {
					e.stopPropagation();
				})
				.position({
					my: "left bottom",
					at: "left top",
					of: picker.el
				});
		}
	});
});
