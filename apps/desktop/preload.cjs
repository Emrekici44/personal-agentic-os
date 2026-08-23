const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld(
  "agenticDesktop",
  Object.freeze({
    environment: "local-desktop",
    shellVersion: "0.1.0",
  }),
);
