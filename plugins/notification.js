const { ipcMain } = require("electron");

const Plugin = require("./interface");

module.exports = class Notification extends Plugin {
  constructor(enabled) {
    super();
    this.enabled = enabled;
  }

  setup(window) {
    window.webContents.on("did-finish-load", () => {
      window.webContents.executeJavaScript(`
      const oldNotification = window.Notification;
      const newNotification = function (title, options) {
        ${this.enabled ? "" : "return;"}
        const notification = new oldNotification(title, options);
        notification.addEventListener("click", function () {
          window.webapp.sendMessage("notification-clicked");
        });
        return notification;
      };

      Object.assign(newNotification, oldNotification);

      window.Notification = newNotification;`);
    });

    ipcMain.on("notification-clicked", () => {
      window.focus();
    });
  }
};
