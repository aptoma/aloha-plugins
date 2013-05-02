define(function (require) {
	'use strict';

	/**
	 * Module dependencies.
	 */
	var Aloha = require('aloha'),
		Ui = require('ui/ui'),
		Button = require('ui/button'),
		plugin = require('aloha/plugin'),
		$ = require('jquery');

	require('jqueryui');

	/**
	 * Plugin CSS dependencies.
	 */
	require('css!./css/styles');

	/**
	 * Create & register the plugin.
	 */
	return plugin.create('charmap', {

		/**
		 * Dialog width.
		 * @type {Number}
		 */
		width: 480,

		/**
		 * Dialog height.
		 * @type {Number}
		 */
		height: 410,

		/**
		 * Dialog element.
		 * @type {jQuery.Element}
		 */
		$dialog: null,

		/**
		 * Default settings.
		 * @type {Object}
		 */
		defaults: {
			charCodes: [
				38, 34, 162, 8364, 163, 165, 169, 174, 8482, 8240, 181, 183, 8226, 8230, 8242, 8243, 167, 182, 223, 8249,
				8250, 171, 187, 8216, 8217, 8220, 8221, 8218, 8222, 60, 62, 8804, 8805, 8211, 8212, 175, 8254, 164, 166,
				168, 161, 191, 710, 732, 176, 8722, 177, 247, 8260, 215, 185, 178, 179, 188, 189, 190, 402, 8747, 8721,
				8734, 8730, 8764, 8773, 8776, 8800, 8801, 8712, 8713, 8715, 8719, 8743, 8744, 172, 8745, 8746, 8706, 8704,
				8707, 8709, 8711, 8727, 8733, 8736, 180, 184, 170, 186, 8224, 8225, 192, 193, 194, 195, 196, 197, 198, 199,
				200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 216, 338, 352, 217, 218, 219,
				220, 221, 376, 222, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240,
				241, 242, 243, 244, 245, 246, 248, 339, 353, 249, 250, 251, 252, 253, 254, 255, 913, 914, 915, 916, 917,
				918, 919, 920, 921, 922, 923, 924, 925, 926, 927, 928, 929, 931, 932, 933, 934, 935, 936, 937, 945, 946,
				947, 948, 949, 950, 951, 952, 953, 954, 955, 956, 957, 958, 959, 960, 961, 962, 963, 964, 965, 966, 967,
				968, 969, 8501, 982, 8476, 977, 978, 8472, 8465, 8592, 8593, 8594, 8595, 8596, 8629, 8656, 8657, 8658,
				8659, 8660, 8756, 8834, 8835, 8836, 8838, 8839, 8853, 8855, 8869, 8901, 8968, 8969, 8970, 8971, 9001, 9002,
				9674, 9824, 9827, 9829, 9830
			]
		},


		/**
		 * Executed on plugin initialization.
		 */
		init: function () {
			// merge user settings with the defaults
			this.settings = $.extend(true, this.defaults, this.settings);

			this.$el = $('<div class="aloha-plugin-charmap"><div class="aloha-plugin-charmap-characters"><div class="aloha-plugin-charmap-preview"></div></div></div>');

			this.createTable();
			this.createDialog();
			this.createButton();
			this.subscribeEvents();
		},

		/**
		 * Subscribe for events.
		 */
		subscribeEvents: function () {
			var self = this;

			Aloha.bind('aloha-editable-deactivated', function () {
				self.$dialog.dialog('close');
			});
		},

		/**
		 * Create the character table.
		 */
		createTable: function () {
			var self = this,
				$characters = $('.aloha-plugin-charmap-characters', this.$el),
				$preview = $('.aloha-plugin-charmap-preview', this.$el);

			$.each(this.settings.charCodes, function (idx, charCode) {
				var character = '&#' + charCode + ';';

				$('<a href="#">' + character + '</a>')
					.click(function () {
						self.onSelectCharacter(character);
						return false;
					})
					.mouseenter(function () {
						$preview.html(character);
					})
					.mouseleave(function () {
						$preview.empty();
					})
					.appendTo($characters);
			});
		},

		/**
		 * Create the jQuery UI dialog.
		 */
		createDialog: function () {
			this.$dialog = this.$el.dialog({
				title: 'Select special character',
				dialogClass: 'aloha-plugin-charmap-dialog',
				modal: false,
				resizable: true,
				width: this.width,
				height: this.height,
				autoOpen: false,
				zIndex: 10101
			});

			// stop event bubbling so Aloha doesn't lose focus when clicking inside the dialog
			this.$dialog.dialog('widget').bind('mousedown', function (e) {
				e.stopPropagation();
			});

			// fix to make jQuery UI dialog behave when using fixed position
			this.$dialog.dialog('widget').draggable('option', {
				'scroll': false,
				'containment': 'window'
			});

			this.$dialog.dialog('option', 'position', {
				my: 'center',
				at: 'center',
				of: window
			});
		},

		/**
		 * Create button to display the dialog.
		 */
		createButton: function () {
			var self = this;

			Ui.adopt('charmap', Button, {
				tooltip: 'Insert special character',
				icon: 'aloha-icon aloha-plugin-charmap-button',
				scope: 'Aloha.continuoustext',
				click: function () {
					self.$dialog.dialog('open');
				}
			});
		},

		/**
		 * Insert the selected character, at the editor's selection.
		 * @param {String} character
		 */
		onSelectCharacter: function (character) {
			if (Aloha.activeEditable) {
				var range = Aloha.Selection.rangeObject;

				range.select();
				Aloha.execCommand('insertHTML', false, character);

				// because after the character was inserted, move the selection forward.
				range.endContainer = range.startContainer;
				range.endOffset = ++range.startOffset;
				range.select();
			}
		}
	});
});