# textresize-plugin

> Adjust text using mouse or keyboard shortcuts. Supports inline styles (font-size, line-height, letter-spacing, word-spacing) or custom CSS classes.

## Getting Started
This plugin requires Grunt.

If you haven't used [Aloha](http://aloha-editor.org/) before, be sure to check out the [Getting Started](http://aloha-editor.org/#howto) guide.

## The plugin

### Overview
In your Aloha config, add a section named `textresize.config` to the plugins configuration to customize the default config. The config below is the default one.

```js
Aloha.settings.plugins.textresize.config = {
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
}
```

### Options for autoFit

#### .margin
Type: `Number`

The number of steps to back of after autofitting text to full width.

### Options for fontSize, lineHeight, letterSpacing, wordSpacing

#### .unit
Type: `String`

Unit to use when applying the value.

#### .className
Type: `String`

If CSS class should be used instead of inline styles. The string `{value}` will be replaced with the current value.

#### .step
Type: `Float`

The amount to change for each step.

#### .page
Type: `Float`

The amount to change for each step when holding down shift (or pressing page up/down).

#### .min
Type: `Float`

Minimum allowed value.

#### .max
Type: `Float`

Maximum allowed value.

#### .value
Type: `Float`

Initial and default value.