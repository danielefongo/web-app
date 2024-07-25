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
  bindings: [ // Optional
    {
      key: "CommandOrControl+Shift+I",
      action: (view) => view.webContents.toggleDevTools(),
    },
  ]
};
```
