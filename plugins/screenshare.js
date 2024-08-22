const {
  ipcMain,
  desktopCapturer,
  BrowserWindow,
  session,
} = require("electron");

const path = require("path");
const fs = require("fs");

const Plugin = require("./interface");
const Css = require("./css");

module.exports = class ScreenShare extends Plugin {
  constructor(enabled, title, css) {
    super();
    this.enabled = enabled;
    this.title = title;
    this.css = css;
  }

  setup(_) {
    if (!this.enabled) return;

    session.defaultSession.setDisplayMediaRequestHandler((_, callback) => {
      desktopCapturer
        .getSources({ types: ["screen", "window"] })
        .then((sources) => {
          if (sources.length === 0) return callback();

          let completed = false;
          let sourcePicker = new BrowserWindow({
            width: 800,
            height: 600,
            frame: false,
            fullscreen: false,
            title: `${this.title} - Screenshare`,
            webPreferences: {
              preload: path.join(__dirname, "screenshare", "preload.js"),
            },
          });

          let css = new Css(this.css);

          sourcePicker.webContents.on("did-finish-load", async () => {
            await sourcePicker.webContents.insertCSS(
              fs.readFileSync(
                path.resolve(__dirname, "screenshare", "style.css"),
                "utf8",
              ),
            );
          });

          css.setup(sourcePicker);

          sourcePicker.on("closed", () => {
            css.unload();
            if (!completed) callback();
          });
          sourcePicker.loadFile(
            path.join(__dirname, "screenshare", "picker.html"),
          );
          sourcePicker.webContents.send("list-sources", sources);

          ipcMain.once("source-selected", (_event, id, name) => {
            completed = true;
            sourcePicker.close();
            if (id) callback({ video: { id, name } });
            else callback();
          });
        });
    });
  }
};
