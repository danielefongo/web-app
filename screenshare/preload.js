const { ipcRenderer } = require("electron");

ipcRenderer.once("list-sources", (_, sources) => {
  let gridHTML = "";
  sources.forEach(({ id, name, thumbnail }) => {
    const truncatedName =
      name.length > 20 ? name.substring(0, 17) + "..." : name;
    gridHTML += `
      <div class="source-item">
        <button class="source-button" source-id="${id}" title="${name}">
          <img class="source-thumbnail" src="${thumbnail.toDataURL()}">
          <div class="source-name">${truncatedName}</div>
        </button>
      </div>
    `;
  });

  document.body.innerHTML = `
    <div class="source-picker">
      <div class="source-grid-container">
        <div class="source-grid">
          ${gridHTML}
        </div>
      </div>
      <div class="cancel-container">
        <button class="cancel-button" source-id="source-cancel">Cancel</button>
      </div>
    </div>
  `;

  document
    .querySelectorAll(".source-button, .cancel-button")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("source-id");
        const title = button.getAttribute("title");
        if (id === "source-cancel") {
          ipcRenderer.sendSync("source-selected", null, "Cancelled");
        } else {
          ipcRenderer.sendSync("source-selected", id, title);
        }
      });
    });
});
