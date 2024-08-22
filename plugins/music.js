const { ipcMain } = require("electron");
const MprisService = require("mpris-service");

const Plugin = require("./interface");

module.exports = class Music extends Plugin {
  constructor(name, music) {
    super();
    this.name = name;
    this.music = music;
  }

  setup(window) {
    if (!this.music) return;

    this.mpris = new MprisService({
      name: this.name,
      identity: this.name,
      supportedMimeTypes: ["audio/*"],
      supportedInterfaces: ["player"],
    });

    window.webContents.on("will-navigate", () => {
      window.webContents.executeJavaScript(`
        if (window.musicInterval) clearInterval(window.musicInterval);
      `);
    });
    window.webContents.on("did-navigate", () => {
      window.webContents.executeJavaScript(`
        window.music = new ${this.music}();
        if (!window.music.getPosition) window.music.getPosition = () => {}
        if (!window.music.setPosition) window.music.setPosition = () => {}
        if (!window.music.getVolume) window.music.getVolume = () => {}
        if (!window.music.setVolume) window.music.setVolume = () => {}
        if (!window.music.getStatus) window.music.getStatus = () => {}
        if (!window.music.setStatus) window.music.setStatus = () => {}
        if (!window.music.next) window.music.next = () => {}
        if (!window.music.previous) window.music.previous = () => {}
        if (!window.music.play) window.music.play = () => {}
        if (!window.music.pause) window.music.pause = () => {}
        if (!window.music.getShuffle) window.music.getShuffle = () => {}
        if (!window.music.setShuffle) window.music.setShuffle = () => {}
        if (!window.music.getLoop) window.music.getLoop = () => {}
        if (!window.music.setLoop) window.music.setLoop = () => {}

        window.musicInterval = setInterval(() => {
          window.webapp.sendMessage("music", {
            position: music.getPosition(),
            volume: music.getVolume(),
            status: music.getStatus(),
            shuffle: music.getShuffle(),
            loop: music.getLoop(),
            metadata: navigator.mediaSession.metadata ? {
              title: navigator.mediaSession.metadata.title,
              artist: navigator.mediaSession.metadata.artist,
              album: navigator.mediaSession.metadata.album,
              artwork: navigator.mediaSession.metadata.artwork
            } : null
          })
        }, 500);
      `);
    });

    ipcMain.on("music", (_, data) => {
      if (data.position) this.mpris.getPosition = () => data.position * 1e6;
      if (data.volume) this.mpris.volume = data.volume;
      if (data.status) this.mpris.playbackStatus = data.status;
      if (data.shuffle) this.mpris.shuffle = data.shuffle;
      if (data.loop) this.mpris.loopStatus = data.loop;
      if (data.metadata)
        this.mpris.metadata = {
          "mpris:trackid": this.mpris.objectPath("track/0"),
          "xesam:title": data.metadata.title,
          "xesam:artist": [data.metadata.artist],
          "xesam:album": data.metadata.album,
        };
    });

    this.mpris.on("shuffle", (enabled) => {
      window.webContents.executeJavaScript(`music.setShuffle(${enabled})`);
    });
    this.mpris.on("loopStatus", (loop) => {
      window.webContents.executeJavaScript(`music.setLoop("${loop}")`);
    });
    this.mpris.on("volume", (volume) => {
      window.webContents.executeJavaScript(`music.setVolume(${volume})`);
    });
    this.mpris.on("seek", (delta) => {
      window.webContents.executeJavaScript(
        `music.setPosition(${(this.mpris.getPosition() + delta) / 1e6})`,
      );
    });
    this.mpris.on("play", () => {
      window.webContents.executeJavaScript(`music.play()`);
    });
    this.mpris.on("pause", () => {
      window.webContents.executeJavaScript(`music.pause()`);
    });
    this.mpris.on("playpause", () => {
      window.webContents.executeJavaScript(`
        if (music.getStatus() == "Playing") {
          music.pause();
        } else {
          music.play();
        }`);
    });
    this.mpris.on("next", () => {
      window.webContents.executeJavaScript(`music.next()`);
    });
    this.mpris.on("previous", () => {
      window.webContents.executeJavaScript(`music.previous()`);
    });
  }
};
