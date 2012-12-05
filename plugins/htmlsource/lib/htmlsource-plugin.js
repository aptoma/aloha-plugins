/*global CodeMirror */
define(function (require) {
	'use strict';

	/**
	 * Module dependencies.
	 */
	var Aloha = require('aloha'),
		Ui = require('ui/ui'),
		Button = require('ui/button'),
		Dialog = require('ui/dialog'),
		plugin = require('aloha/plugin'),
		htmlBeautifier = require('./htmlbeautifier'),
		CodeMirror = require('./codemirror'),
		$ = require('jquery');

	/**
	 * Plugin CSS dependencies.
	 */
	require('css!htmlsource/css/htmlsource');
	require('css!htmlsource/css/codemirror');

	/**
	 * Create & register the plugin.
	 */
	return plugin.create('htmlsource', {

		/**
		 * Dialog width.
		 *
		 * @type {Number}
		 */
		width: 600,

		/**
		 * Dialog height.
		 *
		 * @type {Number}
		 */
		height: 370,

		/**
		 * The active editor.
		 *
		 * @type {Editable}
		 */
		editable: null,

		/**
		 * CodeMirror editor instance.
		 *
		 * @type {CodeMirror}
		 */
		editor: null,

		/**
		 * Content set when opening the dialog (used for restoring).
		 *
		 * @type {String}
		 */
		origContent: null,

		/**
		 * Dialog element.
		 *
		 * @type {jQuery.Element}
		 */
		$dialog: null,

		/**
		 * Default settings.
		 *
		 * @type {Object}
		 */
		defaults: {
			/**
			 * If we should beautify (format) HTML when opening the editor.
			 *
			 * @type {Boolean}
			 */
			beautify: true
		},

		/**
		 * Executed on plugin initialization.
		 */
		init: function () {
			// merge user settings with the defaults
			this.settings = $.extend(true, this.defaults, this.settings);

			this.$element = $('<div class="aloha-plugin-htmlsource">');
			this.createDialog();
			this.createEditor();
			this.createButton();
		},

		/**
		 * Create the editor.
		 *
		 * @see http://codemirror.net/doc/compress.html
		 * (codemirror.js, css.js, javascript.js, xml.js, htmlmixed.js)
		 */
		createEditor: function () {
			var $textarea = $('<textarea>');

			$('<div class="aloha-plugin-htmlsource-container">')
				.append($textarea)
				.appendTo(this.$element);

			this.editor = CodeMirror.fromTextArea($textarea.get(0), {
				mode: 'text/html',
				tabMode: 'indent',
				lineWrapping: true,
				lineNumbers: true,
				onChange: $.proxy(this.onContentChange, this)
			});
		},

		/**
		 * Create the jQuery UI dialog.
		 */
		createDialog: function () {
			this.$dialog = this.$element.dialog({
				title: 'HTML Source Editor',
				dialogClass: 'aloha-plugin-htmlsource-dialog',
				modal: false,
				width: this.width,
				height: this.height,
				autoOpen: false,
				zIndex: 10101,
				create: $.proxy(this.onCreate, this),
				open: $.proxy(this.onOpen, this),
				resizeStop: $.proxy(this.onResized, this),
				close: $.proxy(this.onClose, this),
				buttons: {
					'Restore': $.proxy(this.onRestore, this)
				}
			});

			// stop event bubbling so Aloha doesn't lose focus when clicking inside the dialog
			this.$dialog.dialog('widget').bind('mousedown', function (e) {
				e.stopPropagation();
			});
		},

		/**
		 * Create button to display the dialog.
		 */
		createButton: function () {
			var self = this;

			Ui.adopt('htmlsource', Button, {
				tooltip: 'Open HTML Source Editor',
				icon: 'aloha-icon aloha-plugin-htmlsource-button',
				scope: 'Aloha.continuoustext',
				click: function () {
					self.$dialog.dialog('open');
				}
			});
		},

		/**
		 * Resize the editor according to the dialog size.
		 */
		resizeEditor: function () {
			this.editor.setSize(
				this.$dialog.width(),
				this.$dialog.height()
			);
			this.editor.refresh();
		},

		/**
		 * Called when the dialog is created.
		 *
		 * @param  {jQuery.Event} e
		 * @param  {Object} ui
		 */
		onCreate: function (e, ui) {
			var self = this;

			$('<input type="checkbox" name="wraped" id="wraped" checked="checked" /><label for="wraped">Word wrap</label>').click(function () {
				self.editor.setOption('lineWrapping', $(this).is(':checked'));
			}).appendTo($(e.target).parent().find('.ui-dialog-buttonpane'));
		},

		/**
		 * Called when opening the dialog.
		 *
		 * @param  {jQuery.Event} e
		 * @param  {Object} ui
		 */
		onOpen: function (e, ui) {
			// scroll fix
			this.overflow = $('body').css('overflow');
			$('body').css('overflow', 'hidden');

			this.editable = Aloha.getActiveEditable();
			this.origContent = this.getEditableContent();
			this.editor.setValue(this.settings.beautify ? this.beautifyHtml(this.origContent) : this.origContent);

			this.resizeEditor();
		},

		/**
		 * Called when the dialog has been resized.
		 *
		 * @param  {jQuery.Event} e
		 * @param  {Object} ui
		 */
		onResized: function (e, ui) {
			this.resizeEditor();
		},

		/**
		 * Called when closing the dialog.
		 *
		 * @param  {jQuery.Event} e
		 * @param  {Object} ui
		 */
		onClose: function (e, ui) {
			$('body').css('overflow', this.overflow);
		},

		/**
		 * Called when restoring to original content.
		 */
		onRestore: function () {
			this.$dialog.dialog('close');
			this.setEditableContent(this.origContent);
		},

		/**
		 * Called every time the content of the editor is changed.
		 */
		onContentChange: function () {
			this.setEditableContent(this.editor.getValue());
		},

		/**
		 * Beautify the HTML (auto-indent).
		 *
		 * @param  {String} content
		 * @return {String}
		 */
		beautifyHtml: function (content) {
			return htmlBeautifier(content, {
				brace_style: 'collapse',
				break_chained_methods: false,
				indent_char: ' ',
				indent_scripts: 'normal',
				indent_size: '4',
				keep_array_indentation: false,
				preserve_newlines: true,
				space_after_anon_function: true,
				space_before_conditional: true,
				unescape_strings: false
			});
		},

		/**
		 * Get HTML of the editable. Note that we are not using editable.getContents() to avoid serialization made
		 * in dom-to-xhtml plugin that will mess up intended white-spacing (&nbsp;).
		 *
		 * @return {String}
		 */
		getEditableContent: function () {
			return this.editable.obj.html();
		},

		/**
		 * Set the contents of this editable as a HTML string. Note that we're not using
		 * this.editable.setContents() to avoid aloha-editable-deactivated event.
		 *
		 * @param {String} content
		 */
		setEditableContent: function (content) {
			// don't use jQuery .html() since it executes content in script elements and remove them
			this.editable.obj.get(0).innerHTML = content;

			this.editable.smartContentChange({
				type: 'set-contents'
			});
		}
	});
});
