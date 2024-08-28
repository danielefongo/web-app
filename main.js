const { app, globalShortcut, session, BrowserWindow } = require("electron");

const Notification = require("./plugins/notification");
const Css = require("./plugins/css");
const Music = require("./plugins/music");
const Screenshare = require("./plugins/screenshare");

const path = require("path");
const fs = require("fs");

const uriString = process.argv[process.argv.length - 1].startsWith("--")
  ? null
  : process.argv[process.argv.length - 1];

const quit = (code) => {
  app.quit();
  unregisterShortcuts();
  if (code) process.exit(code);
};

const getArgument = (argName) => {
  const index = process.argv.indexOf(argName);
  return index !== -1 && process.argv.length > index + 1
    ? process.argv[index + 1]
    : null;
};

const configFile = getArgument("--config");
if (!configFile || !fs.existsSync(path.resolve(configFile))) {
  console.error("Config file not found");
  quit(1);
}
const config = require(path.resolve(configFile));

const setUserAgent = () => {
  if (!config.userAgent) return;
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["User-Agent"] = config.userAgent;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
};

const unregisterShortcuts = () => {
  globalShortcut.unregisterAll();
};

const registerShortcuts = () => {
  for (const binding of config.bindings || []) {
    globalShortcut.register(binding.key, () => {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        binding.action(focusedWindow);
      }
    });
  }
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    fullscreen: false,
    webPreferences: {
      contextIsolation: true,
      preload: __dirname + "/preload.js",
    },
  });

  let plugins = [
    new Notification(config.notifications),
    new Css(config.css),
    new Music(config.title, config.music),
    new Screenshare(config.screenshare, config.title, config.css),
  ];

  if (config.userAgent) mainWindow.webContents.setUserAgent(config.userAgent);
  mainWindow.webContents.loadURL(config.site);

  plugins.forEach((plugin) => plugin.setup(mainWindow));

  let navigated = false;
  mainWindow.webContents.on("did-navigate", async () => {
    if (!navigated && uriString) {
      navigated = true;
      mainWindow.webContents.loadURL(
        (config.urlParser || ((it) => it))(uriString),
      );
    }
    mainWindow.setTitle("");
    if (config.icon) mainWindow.setIcon(path.resolve(config.icon));
  });

  mainWindow.on("closed", quit);
};

const runApp = () => {
  app.setName(config.title);
  app.setPath(
    "userData",
    path.join(app.getPath("userData"), config.dataFolder || config.title),
  );
  registerShortcuts();
  setUserAgent();
  createWindow();
  app.commandLine.appendSwitch("disable-features", "MediaSessionService");
};

app.whenReady().then(runApp);
app.on("browser-window-focus", registerShortcuts);
app.on("browser-window-blur", unregisterShortcuts);
app.on("window-all-closed", quit);
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    runApp();
  }
});
