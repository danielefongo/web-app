const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("webapp", {
  sendMessage: (message, ...args) => ipcRenderer.send(message, ...args),
});
