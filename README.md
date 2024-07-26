# Web App

Just a wrapper for sites.

## Usage

```bash
./WebApp-<VERSION>.AppImage --config <config-file>
```

### Configuration file

Example:

```js
module.exports = {
  title: "Title", // Required
  site: "https://site.com", // Required
  css: "style.css", // Optional, hot reloaded if changed
  icon: "icon.png", // Optional
  userAgent: "My User Agent", // Optional
  dataFolder: "MyApp", // Optional, fallbacks to title. Used for storing settings
  bindings: [ // Optional
    {
      key: "CommandOrControl+Shift+I",
      action: (view) => view.webContents.toggleDevTools(),
    },
  ]
};
```

#### Source picker css

With the css file defined in the configuration, you can use the following css to style the source picker:

```css
:root {
  --web-app-source-picker-background: #0a0a0a;
  --web-app-source-picker-item-bg: #1d1d1d;
  --web-app-source-picker-item-fg: #bbbbbb;
  --web-app-source-picker-item-border: #1d1d1d;
  --web-app-source-picker-highlight-bg: #72cef3;
  --web-app-source-picker-highlight-fg: #1d1d1d;
  --web-app-source-picker-highlight-border: #72cef3;
  --web-app-source-picker-cancel-fg: #ffffff;
  --web-app-source-picker-cancel-bg: #c6152f;
  --web-app-source-picker-cancel-hover-fg: #0a0a0a;
  --web-app-source-picker-cancel-hover-bg: #f53853;
}
/* These are the default values */
```
