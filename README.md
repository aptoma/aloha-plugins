# Custom plugins for the [Aloha](http://aloha-editor.org/) editor

The plugins are currently in one repository since they have shared dependencies.

## Installation

Make a custom directory somewhere (preferably outside of the standard Aloha directory) and clone the repository.

	$ mkdir aloha
	$ git clone https://github.com/aptoma/aloha-plugins.git aloha/aptoma

To use the plugins you have to configure a custom path for the plugins.

	Aloha.settings = {
		requireConfig: {
			// path needed for shared libs used by plugins
			paths: {
				'aptoma': '../../../aloha/aptoma'
			}
		},
		// path for custom plugins (relative from Aloha.settings.baseUrl)
		bundles: {
			'aptoma': '../../../aloha/aptoma/plugins'
		},
		plugins: {
			// which plugins to load
			load: [
				'common/ui',
				'aptoma/styles',
				'aptoma/font',
				'aptoma/textresize',
				'aptoma/colorpicker',
				'aptoma/reset',
				'aptoma/htmlsource'
			]
		}
	};

## Notes

Some of the plugins currently depends on [our fork](https://github.com/aptoma/Aloha-Editor) of the Aloha editor which contains some fixes not in the orignal repo (yet).

## Configuration

See each plugin for configuration examples.

## Tests

	$ grunt jshint
