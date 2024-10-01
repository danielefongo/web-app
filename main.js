const { app, globalShortcut, session, BrowserWindow } = require("electron");

const Notification = require("./plugins/notification");
const Css = require("./plugins/css");
const Music = require("./plugins/music");
const Screenshare = require("./plugins/screenshare");

const path = require("path");
const fs = require("fs");
const OpenExternally = require("./plugins/openExternally");

let mainWindow;

const getURI = (argv) => {
  const uriRegex = /^[a-z]+:\/\//i;

  return (
    argv.slice(1).findLast((arg) => {
      if (arg.startsWith("--") || !uriRegex.test(arg)) return false;

      try {
        const url = new URL(arg);
        return url.protocol !== "file:" && url.protocol !== ":";
      } catch {
        return false;
      }
    }) ?? null
  );
};

const loadURI = (uri) => {
  if (mainWindow && uri !== null) {
    let url = (config.uriParser || ((it) => it))(uri);
    if (url) mainWindow.loadURL(url);
  }
};

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

const unregisterShortcuts = () => {
  for (const binding of config.bindings || []) {
    globalShortcut.unregister(binding.key);
  }
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

const registerGlobalBindings = () => {
  for (const binding of config.globalBindings || []) {
    globalShortcut.register(binding.key, () => {
      binding.action(mainWindow);
    });
  }
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
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
    new OpenExternally(),
  ];

  if (config.userAgent) mainWindow.webContents.setUserAgent(config.userAgent);
  mainWindow.webContents.loadURL(config.site);

  plugins.forEach((plugin) => plugin.setup(mainWindow));

  let navigated = false;
  mainWindow.webContents.on("did-navigate", async () => {
    if (!navigated) {
      navigated = true;
      loadURI(getURI(process.argv));
    }
    mainWindow.setTitle("");
    if (config.icon) mainWindow.setIcon(path.resolve(config.icon));
  });

  mainWindow.on("closed", quit);
};

app.setName(config.configFolder || config.title);

const runApp = () => {
  registerShortcuts();
  registerGlobalBindings();
  setUserAgent();
  createWindow();
  app.commandLine.appendSwitch("disable-features", "MediaSessionService");
};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.on("second-instance", () => {
    app.quit();
  });
  app.whenReady().then(() => {
    app.focus({ steal: true });
    app.quit();
  });
} else {
  app.on("second-instance", (_, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    loadURI(getURI(commandLine));
  });
  app.whenReady().then(runApp);
  app.on("browser-window-focus", registerShortcuts);
  app.on("browser-window-blur", unregisterShortcuts);
  app.on("window-all-closed", quit);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      runApp();
    }
  });
}
