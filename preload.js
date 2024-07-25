const { ipcRenderer } = require("electron");

const oldNotification = window.Notification;
const newNotification = function (title, options) {
  const notification = new oldNotification(title, options);
  notification.addEventListener("click", function () {
    ipcRenderer.send("notification-clicked");
  });
  return notification;
};

Object.assign(newNotification, oldNotification);

window.Notification = newNotification;
