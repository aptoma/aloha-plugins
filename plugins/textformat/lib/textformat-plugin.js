define(function (require) {
	'use strict';

	/**
	 * Module dependencies.
	 */
	var Aloha = require('aloha'),
		Ui = require('ui/ui'),
		ToggleButton = require('ui/toggleButton'),
		PubSub = require('PubSub'),
		plugin = require('aloha/plugin'),
		Format = require('format/format-plugin'),
		$ = require('jquery');

	/**
	 * Plugin CSS dependencies.
	 */
	require('css!./css/styles');

	var interchangeableNodeNames = {
		'B': ['STRONG', 'B'],
		'I': ['EM', 'I'],
		'STRONG': ['STRONG', 'B'],
		'EM': ['EM', 'I']
	};

	/**
	 * Create & register the plugin.
	 */
	return plugin.create('textformat', {

		/**
		 * Executed on plugin initialization.
		 */
		init: function () {
			var self = this;

			this.buttons = {};

			this.buttons['p'] = Ui.adopt('p', ToggleButton, {
				tooltip: 'Paragraph',
				icon: 'textformat-plugin-icon textformat-plugin-icon-p',
				click: function () {
					Format.changeMarkup('p');
				}
			});

			this.buttons['h3'] = Ui.adopt('h3', ToggleButton, {
				tooltip: 'Title',
				icon: 'textformat-plugin-icon textformat-plugin-icon-h3',
				click: function () {
					Format.changeMarkup('h3');
				}
			});

			PubSub.sub('aloha.selection.context-change', function (message) {
				self.onSelectionChanged(message.range);
			});
		},

		/**
		 * Will be called every time the context of the selection changes.
		 * @param  {GENTICS.Utils.RangeObject} range
		 */
		onSelectionChanged: function (rangeObject) {
			$.each(this.buttons, function (key, button) {
				var statusWasSet = false,
					nodeName = key.toUpperCase(),
					nodeNames = interchangeableNodeNames[nodeName] || [nodeName];

				for (var i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
					var effectiveMarkup = rangeObject.markupEffectiveAtStart[i];
					for (var j = 0; j < nodeNames.length; j++) {
						if (Aloha.Selection.standardTextLevelSemanticsComparator(effectiveMarkup, $('<' + nodeNames[j] + '>'))) {
							button.setState(true);
							statusWasSet = true;
						}
					}
				}

				if (!statusWasSet) {
					button.setState(false);
				}
			});
		}
	});
});