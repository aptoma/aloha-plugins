module.exports = (grunt) ->
	'use strict'

	# Grunt project configuration.
	# ----------------------
	@initConfig
		pkg: grunt.file.readJSON("package.json")

		# JSHint task.
		# https://github.com/gruntjs/grunt-contrib-jshint
		# -----------------------------------------------
		jshint:
			options:
				jshintrc: ".jshintrc"
			all: [
				"plugins/*/lib/*-plugin.js"
				"lib/css.js"
				"lib/dom.js"
				"lib/range.js"
				"lib/selection.js"
			]

		# Clear files and folders task.
		# https://github.com/gruntjs/grunt-contrib-clean
		# ----------------------------------------------
		clean:
			dist: [
				"dist/_*.css"
			]

		# Task for embedding images as base64 data URIs inside your stylesheets.
		# https://npmjs.org/package/grunt-image-embed
		# ----------------------------------------------------------------------
		imageEmbed:
			charmap:
				src: "plugins/charmap/css/styles.css"
				dest: "dist/_charmap.css"
			colorpicker:
				src: "plugins/colorpicker/css/styles.css"
				dest: "dist/_colorpicker.css"
			font:
				src: "plugins/font/css/styles.css"
				dest: "dist/_font.css"
			codemirror:
				src: "plugins/htmlsource/css/codemirror.css"
				dest: "dist/_codemirror.css"
			htmlsource:
				src: "plugins/htmlsource/css/htmlsource.css"
				dest: "dist/_htmlsource.css"
			reset:
				src: "plugins/reset/css/styles.css"
				dest: "dist/_reset.css"
			styles:
				src: "plugins/styles/css/styles.css"
				dest: "dist/_styles.css"
			textresize:
				src: "plugins/textresize/css/textresize.css"
				dest: "dist/_textresize.css"
			textformat:
				src: "plugins/textformat/css/styles.css"
				dest: "dist/_textformat.css"
			options:
				deleteAfterEncoding : false

		# Task for compress CSS files.
		# https://github.com/gruntjs/grunt-contrib-cssmin
		# -----------------------------------------------
		cssmin:
			options:
				report: "min"
			minify:
				files:
					"dist/plugins.min.css": [
						"dist/_*.css"
						"plugins/colorpicker/vendor/spectrum/spectrum.css"
					]

		# RequireJS task.
		# https://github.com/gruntjs/grunt-contrib-requirejs
		# --------------------------------------------------
		requirejs:
			options:
				optimize: "uglify"
				paths:
					"charmap": "plugins/charmap/lib"
					"colorpicker": "plugins/colorpicker/lib"
					"colorpicker/vendor": "plugins/colorpicker/vendor"
					"font": "plugins/font/lib"
					"htmlsource": "plugins/htmlsource/lib"
					"reset": "plugins/reset/lib"
					"styles": "plugins/styles/lib"
					"textformat": "plugins/textformat/lib"
					"textresize": "plugins/textresize/lib"
					"aptoma/lib/dom": "lib/dom"
					"aptoma/lib/css": "lib/css"
					"aptoma/lib/selection": "lib/selection"
					"aptoma/lib/range": "lib/range"
					"aptoma/lib/style": "lib/style"
					"aptoma/lib/ui/menuButton": "lib/ui/menuButton"
					"aloha": "empty:"
					"ui/ui": "empty:"
					"ui/button": "empty:"
					"ui/component": "empty:"
					"ui/utils": "empty:"
					"aloha/plugin": "empty:"
					"aloha/rangy-core": "empty:"
					"PubSub": "empty:"
					"jquery": "empty:"
					"jqueryui": "empty:"
					"ui/toggleButton": "empty:"
					"format/format-plugin": "empty:"
			compile:
				options:
					out: "dist/plugins.min.js"
					include: [
						"charmap/charmap-plugin"
						"colorpicker/colorpicker-plugin"
						"font/font-plugin"
						"htmlsource/htmlsource-plugin"
						"reset/reset-plugin"
						"styles/styles-plugin"
						"textformat/textformat-plugin"
						"textresize/textresize-plugin"
					]

		# Run tasks whenever watched files change.
		# https://github.com/gruntjs/grunt-contrib-watch
		# ----------------------------------------------
		watch:
			js:
				files: "plugins/**/*.js"
				tasks: ["jshint", "requirejs"]
			css:
				files: "plugins/**/*.css"
				tasks: ["imageEmbed", "cssmin"]

	# Load tasks.
	# -----------
	@loadNpmTasks "grunt-contrib-jshint"
	@loadNpmTasks "grunt-contrib-requirejs"
	@loadNpmTasks "grunt-contrib-clean"
	@loadNpmTasks "grunt-contrib-cssmin"
	@loadNpmTasks "grunt-contrib-watch"
	@loadNpmTasks "grunt-image-embed"

	# Register tasks.
	# ---------------
	@registerTask "default", [
		"jshint"
		"requirejs"
		"imageEmbed"
		"cssmin"
		"clean"
	]