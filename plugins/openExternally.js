const { ipcMain, shell } = require("electron");

const Plugin = require("./interface");

module.exports = class OpenExternally extends Plugin {
  constructor() {
    super();
  }

  setup(window) {
    window.webContents.on("did-finish-load", () => {
      window.webContents.executeJavaScript(`
      document.addEventListener('click', (event) => {
        const isCtrlPressed = event.ctrlKey || event.metaKey;
        const link = event.target.closest('a');
        
        if (isCtrlPressed && link) {
          event.preventDefault();
          const url = link.href;
          window.webapp.sendMessage('url-open', url);
        }
      })`);
    });

    ipcMain.on("url-open", (_, url) => {
      shell.openExternal(url);
    });
  }
};
