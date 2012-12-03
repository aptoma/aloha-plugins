#HTML Source Editor - Aloha Plugin.

Load the plugin and configure the toolbar to show the component "htmlsource".
When clicking the button a dialog should be displayed for editing the source.


* Download the plugin and save it as /plugins/extra/htmlsource/
* Add "extra/htmlsource" to the list of plugins to load
* Adapt the Aloha Editor configuration for the toolbar:


```javascript
Aloha.settings = {
	toolbar: {
		tabs: [
			{
				label: 'tab.format.label'
			},
			{
				label: 'tab.insert.label'
			},
			{
				label: 'Actions',
				showOn: {
					scope: 'Aloha.continuoustext'
				},
				components: [['htmlsource']]
			}
		]
	}
 }
```

The "View HTML Source" button ("htmlsource") will be added to a new tab labeled "Actions". That tab will be on the 3rd position after the "Format" and "Insert" tab.


## CSS

You'll also need to add a jQuery UI CSS style / theme.

```html
<link href="http://code.jquery.com/ui/1.9.0/themes/base/jquery-ui.css" rel="stylesheet" type="text/css" />
```

## Demo

I can't provide a demo online right now due to some technical issues. So if you want to test it, do the following.

	$ git clone git@github.com:pahen/aloha-plugin-htmlsource.git
	$ open aloha-plugin-htmlsource/example/index.html
