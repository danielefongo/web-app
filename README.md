# Web App

Just a wrapper for sites.

## Usage

```
./WebApp-<VERSION>.AppImage --config <config-file> [<url>]
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
  configFolder: "MyApp", // Optional, fallbacks to title. Used for storing settings (e.g. ~/.config/MyApp)
  urlParser: (url) => { ... }, // Optional, used to parse the url
  music: class MusicPlayer { ... } // Optional
  notifications: true, // Optional, default false
  screenshare: true, // Optional, default false
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

#### Music player

With the music class defined in the configuration, you can use playerctl to manipulate the music player. You can use the following class as a base, with all methods being optional:

```javascript
class SamplePlayer {
  getPosition() {} // return seconds
  setPosition(seconds) {} // accepts seconds
  getVolume() {} // return volume (0-1)
  setVolume(volume) {} // accepts volume (0-1)
  getStatus() {} // return "Playing" or "Paused"
  next() {} // skip to next track
  previous() {} // go back to previous track
  play() {} // play the current track
  pause() {} // pause the current track
  getShuffle() {} // return true or false
  setShuffle(enabled) {} // accepts true or false
  getLoop() {} // return "None", "Track" or "Playlist"
  setLoop(status) {} // accepts "None", "Track" or "Playlist"
}
```

To update immediately the music player status (the one exposed to playerctl), you can use the following code inside the player functions:

```javascript
window.webapp.sendMessage("music", payload)

// Example payload. All fields are optional
{
  position: 42,
  volume: 1,
  status: "Playing",
  shuffle: true
  loop: "Playlist",
  metadata: {
    title: "My Song",
    artist: "My Artist",
    album: "My Album",
    artwork: "https://example.com/artwork.jpg"
  }
}
```
