const Plugin = require("./interface");

const fs = require("fs");
const path = require("path");

module.exports = class Css extends Plugin {
  constructor(file) {
    super();
    this.cssKey = null;
    this.watcher = null;
    this.file = file;
  }

  setup(window) {
    this.window = window;
    window.webContents.on("did-finish-load", () => this._watch());
    window.webContents.on("did-navigate", () => this._watch());
  }

  unload() {
    this._unwatch();
  }

  async _watch() {
    if (this.file) {
      let filename = path.resolve(this.file);

      if (fs.existsSync(filename)) {
        const css = fs.readFileSync(filename, "utf8");
        if (this.cssKey) {
          await this.window.webContents.removeInsertedCSS(this.cssKey);
        }
        this.cssKey = await this.window.webContents.insertCSS(css);

        if (!this.watcher) {
          this.watcher = fs.watch(filename, async (eventType) => {
            if (eventType === "change") {
              const updatedCss = fs.readFileSync(filename, "utf8");
              if (this.cssKey) {
                await this.window.webContents.removeInsertedCSS(this.cssKey);
              }
              this.cssKey = await this.window.webContents.insertCSS(updatedCss);
            }
          });
        }
      }
    }
  }

  async _unwatch() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.cssKey) {
      await this.window.webContents.removeInsertedCSS(this.cssKey);
      this.cssKey = null;
    }
  }
};
