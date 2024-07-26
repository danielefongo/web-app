const fs = require("fs");
const path = require("path");

class cssWatcher {
  constructor(view, file) {
    this.cssKey = null;
    this.watcher = null;
    this.file = file;
    this.view = view;
  }

  async watch() {
    if (this.file) {
      let filename = path.resolve(this.file);

      if (fs.existsSync(filename)) {
        const css = fs.readFileSync(filename, "utf8");
        this.cssKey = await this.view.webContents.insertCSS(css);

        if (!this.watcher) {
          this.watcher = fs.watch(filename, async (eventType) => {
            if (eventType === "change") {
              const updatedCss = fs.readFileSync(filename, "utf8");
              if (this.cssKey) {
                await this.view.webContents.removeInsertedCSS(this.cssKey);
              }
              this.cssKey = await this.view.webContents.insertCSS(updatedCss);
            }
          });
        }
      }
    }
  }

  async unwatch() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.cssKey) {
      await this.view.webContents.removeInsertedCSS(this.cssKey);
      this.cssKey = null;
    }
  }
}

module.exports = cssWatcher;
