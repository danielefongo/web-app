const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("webapp", {
  sendMessage: (...args) => ipcRenderer.send(...args),
});
