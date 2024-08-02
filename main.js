const { app, globalShortcut, session, BrowserWindow } = require("electron");

const Notification = require("./plugins/notification");
const Css = require("./plugins/css");

const prepareScreenshare = require("./screenshare/main");
const path = require("path");
const fs = require("fs");

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

  let plugins = [new Notification(), new Css(config.css)];

  plugins.forEach((plugin) => plugin.setup(mainWindow));

  if (config.userAgent) mainWindow.webContents.setUserAgent(config.userAgent);
  mainWindow.webContents.loadURL(config.site);

  mainWindow.webContents.on("did-navigate", async () => {
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
  prepareScreenshare(config);
  registerShortcuts();
  setUserAgent();
  createWindow();
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
