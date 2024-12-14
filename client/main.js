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
        try {
            const response = await axios.post(env.localServerEndpoint + "transfer", requestData).then(response => {
                event.reply("transfer-success", response.data);   
            });
        } catch (error) {
            event.reply("transfer-error", error.message);
        }
    });

    ipcMain.on("edit-file", async (event, data) => {
        event.reply("debug-log", `Received Data: ${JSON.stringify(data)}`)
        const requestData = {
            name: data.name,
            file: data.path,
        }
        try {
            const response = await axios.post(env.localServerEndpoint + "edit", requestData).then(response => {
                event.reply("edit-success", response.data); 
            });
        } catch (error) {
            event.reply("edit-error", error.message);
        }
    });

    ipcMain.on("delete-file", async (event, data) => {
        const requestData = {
            file: data.file,
            type: data.type
        }
        try {
            const response = axios.post(env.localServerEndpoint + "delete", requestData).then(response => {
                event.reply("delete-success", response.data);
            });
        } catch (error) {
            event.reply("delete-error", error.message)
        }
    });

    ipcMain.on("create-file", async (event, data) => {
        const requestData = {
            name: data.name,
            path: data.path,
            type: data.type
        }
        try {
            const response = axios.post(env.localServerEndpoint + "create", requestData).then(response => {
                event.reply("create-success", response.data);
            });
        } catch (error) {
            event.reply("create-error", error.message)
        }
    });
});
