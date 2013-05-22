define(function (require) {
    'use strict';

    /**
     * Module dependencies.
     */
	var rangy = require('aloha/rangy-core');

    return {

        /**
         * Creates and returns a Rangy CssClassApplier object. Elements created by this object are given the
         * CSS class cssClass. Each property of the options parameter object is optional and uses the
         * appropriate default value if not specified. The available properties are:
         *
         * elementTagName: The tag name of the element to use for surrounding text. This may be any inline
         * element that may contain text. The default is "span".
         *
         * elementProperties: An object containing properties that are copied to each element created to surround text
         *
         * ignoreWhiteSpace: Boolean value indicating whether to ignore insignificant white space text nodes (such as
         * a line break and/or indentation between <p> tags in the HTML source of the page). The default is true.
         *
         * applyToEditableOnly: Boolean value indicating whether to only apply the CSS class to editable content
         * (contentEditable true or designMode "on"). The default is false.
         *
         * normalize: Boolean value indicating whether the CssClassApplier will merge adjacent text nodes and adjacent
         * spans marked with its own unique CSS class whenever it acts on a range or selection. As per the normalize
         * function parameter in Rangy 1.1.
         *
         * @see http://code.google.com/p/rangy/wiki/CSSClassApplierModule
         *
         * @param {String} cssClass
         * @param {Object} options
         * @param {Array} tagNames
         * @return {CssClassApplier}
         */
        createClassApplier: function (cssClass, options, tagNames) {
            options = options || {};
            options.applyToEditableOnly = true;
            return rangy.createCssClassApplier(cssClass, options, tagNames);
        }
    };
});
