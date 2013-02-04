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
			},
			map {
				// use our modified Rangy lib which fixes the problem with the CssClassApplier module loading issues
				'*': {
					'vendor/rangy-core': '../../../components/aloha-plugins/lib/rangy-core'
				}
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
				'aptoma/align-dev',
				'aptoma/styles',
				'aptoma/font',
				'aptoma/textresize',
				'aptoma/colorpicker',
				'aptoma/reset',
				'aptoma/htmlsource'
			]
		}

	};

## Configuration

See each plugin for configuration examples.

## Tests

Coming soon ..
