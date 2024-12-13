const { app, BrowserWindow, ipcMain } = require("electron");
const envy = require('envy');
const axios = require("axios");
const path = require("path");

const env = envy()
app.whenReady().then(() => {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },  
    });

    mainWindow.loadFile("index.html");

    ipcMain.on("transfer-files", async (event, data) => {
        const requestData = {
            filePath: data.path,
            targetDir: data.dir,
        }
        event.reply("debug-log", `Received Data: ${JSON.stringify(data)}`)
        try {
            const response = await axios.post(env.localServerEndpoint, requestData);
            event.reply("transfer-success", response.data);
        } catch (error) {
            event.reply("transfer-error", error.message);
        }
    });
});
