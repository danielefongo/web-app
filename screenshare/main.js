const {
  ipcMain,
  desktopCapturer,
  BrowserWindow,
  session,
} = require("electron");

const path = require("path");
const fs = require("fs");

module.exports = (appTitle) => {
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
          title: `${appTitle} - Screenshare`,
          webPreferences: {
            preload: path.join(__dirname, "preload.js"),
          },
        });
        sourcePicker.webContents.on("did-finish-load", async () => {
          await sourcePicker.webContents.insertCSS(
            fs.readFileSync(path.resolve(__dirname, "style.css"), "utf8"),
          );
        });
        sourcePicker.on("closed", () => {
          if (!completed) callback();
        });
        sourcePicker.loadFile(path.join(__dirname, "picker.html"));
        sourcePicker.webContents.send("list-sources", sources);

        ipcMain.once("source-selected", (_event, id, name) => {
          completed = true;
          sourcePicker.close();
          if (id) callback({ video: { id, name } });
          else callback();
        });
      });
  });
};
