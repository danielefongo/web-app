const {
  app,
  globalShortcut,
  ipcMain,
  session,
  BrowserWindow,
  WebContentsView,
} = require("electron");

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

const title = getArgument("--title");
const site = getArgument("--site");
const icon = getArgument("--icon");
const css = getArgument("--css");
const userAgent = getArgument("--user-agent");
const load = getArgument("--load");

if (!title) {
  console.error("Error: The '--title' parameter is required.");
  quit(1);
}

if (!site) {
  console.error("Error: The '--site' parameter is required.");
  quit(1);
}

const setUserAgent = () => {
  if (!userAgent) return;
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["User-Agent"] = userAgent;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
};

const registerShortcuts = () => {
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      let currentView = focusedWindow.contentView.children[0];
      currentView.webContents.toggleDevTools();
    }
  });
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

  const loading = new WebContentsView();
  loading.webContents.loadFile(
    load ? path.resolve(load) : path.join(__dirname, "load.html"),
  );

  loading.setBounds({ x: 0, y: 0, width: 0, height: 0 });

  const view = new WebContentsView({
    webPreferences: {
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  view.webContents.loadURL(site);
  view.setBounds({ x: 0, y: 0, width: 800, height: 400 });

  mainWindow.contentView.addChildView(view);

  mainWindow.on("resize", () => {
    let winBounds = mainWindow.getBounds();
    let width = winBounds.width;
    let height = winBounds.height;
    view.setBounds({ x: 0, y: 0, width, height });
    loading.setBounds({ x: 0, y: 0, width, height });
  });

  let cssKey;
  let watcher;

  view.webContents.on("will-navigate", () => {
    mainWindow.contentView.removeChildView(view);
    mainWindow.contentView.addChildView(loading);
  });
  view.webContents.on("did-finish-load", async () => {
    mainWindow.contentView.removeChildView(loading);
    mainWindow.contentView.addChildView(view);

    if (css) {
      let filename = path.resolve(css);
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
    mainWindow.setTitle(title);
    if (icon) mainWindow.setIcon(path.resolve(icon));
  });

  mainWindow.on("closed", quit);
};

const runApp = () => {
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
