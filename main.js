const {
  app,
  globalShortcut,
  ipcMain,
  session,
  BrowserWindow,
  WebContentsView,
} = require("electron");

const prepareScreenshare = require("./screenshare/main");
const path = require("path");
const fs = require("fs");

const quit = (code) => {
  app.quit();
  globalShortcut.unregisterAll();
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

const registerShortcuts = () => {
  for (const binding of config.bindings || []) {
    globalShortcut.register(binding.key, () => {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        let currentView = focusedWindow.contentView.children[0];
        binding.action(currentView);
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
  });

  ipcMain.on("notification-clicked", () => {
    mainWindow.focus();
  });

  const view = new WebContentsView({
    webPreferences: {
      contextIsolation: false,
      preload: __dirname + "/preload.js",
    },
  });
  if (config.userAgent) view.webContents.setUserAgent(config.userAgent);
  view.webContents.loadURL(config.site);
  view.setBounds({ x: 0, y: 0, width: 800, height: 400 });

  mainWindow.contentView.addChildView(view);

  mainWindow.on("resize", () => {
    let winBounds = mainWindow.getBounds();
    let width = winBounds.width;
    let height = winBounds.height;
    view.setBounds({ x: 0, y: 0, width, height });
  });

  let cssKey;
  let watcher;

  view.webContents.on("did-navigate", async () => {
    if (config.css) {
      let filename = path.resolve(config.css);
      if (fs.existsSync(filename)) {
        const css = fs.readFileSync(filename, "utf8");
        cssKey = await view.webContents.insertCSS(css);

        if (!watcher) {
          watcher = fs.watch(filename, async (eventType) => {
            if (eventType === "change") {
              const updatedCss = fs.readFileSync(filename, "utf8");
              if (cssKey) {
                await view.webContents.removeInsertedCSS(cssKey);
              }
              cssKey = await view.webContents.insertCSS(updatedCss);
            }
          });
        }
      }
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
  prepareScreenshare(config.title);
  registerShortcuts();
  setUserAgent();
  createWindow();
};

app.whenReady().then(runApp);
app.on("window-all-closed", quit);
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    runApp();
  }
});
