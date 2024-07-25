# Web App

Just a wrapper for sites.

## Usage

```bash
./WebApp-<VERSION>.AppImage \
    --config <config-file> \
    --site <site> \
    --css <css-location> \
    --icon <icon-location> \
```

### Configuration file

```js
module.exports = {
  title: "Title", // Required
  site: "https://site.com", // Required
  css: "style.css", // Optional, hot reloaded if changed
  icon: "icon.png", // Optional
  userAgent: "My User Agent", // Optional
};
```
