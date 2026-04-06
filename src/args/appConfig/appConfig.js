#!/usr/bin/env node
// appConfig helper — encapsulates logic for printing app's config file details
const path = require('path');
const { spawn } = require("child_process");
const config  = require('#config');

// config file path (the path for user after installation)
const filePathForAppConfig = require.resolve('#config');
let isOpenConfigFile = false;

function printAppConfigDetails() {
    console.log("App's config file details:");
    console.log(" - file path:", filePathForAppConfig);
    console.log(" - config object:", config);
    console.log("Update 'userConfig' manually in config.js to match your environment (e.g. repo paths), then use this command to verify the details.");
}
async function openFile__OLD(filePath, targetApp) {
    // approach-1
    // const open = require('open');
    // open(filePathForAppConfig);
    // approach-2
    // try {
    //     const open = (await import('open')).default;
    //     await open(filePath);
    //     console.log("Opened file successfully:", filePath);
    // } catch (err) {
    //     require('child_process').spawn('notepad', [filePath]);
    //     console.log("Error opening file:", err);
    // }
    // approach-3
    // try {
    //     const open = (await import('open')).default;
    //     await open(filePath, { app: { name: 'notepad' } });
    // } catch {
    //     spawn("notepad", [filePath], {
    //         detached: true,
    //         stdio: "ignore"
    //     }).unref();
    // }
    // approach-4
    // const { exec } = require("child_process");
    // exec(`start "" "${filePathForAppConfig}"`);
    //approach-5
    // spawn("cmd", ["/c", "start", "", filePathForAppConfig], {
    //     detached: true,
    //     stdio: "ignore",
    //     shell: true
    // }).unref();
}
async function openFile(filePath, targetApp) {
    // approach-6: open the file with "notepad" or any specified app, and if that fails, open with default app
    if (isOpenConfigFile) {
        console.log("Config already opened.");
        return;
    }
    const child = spawn(targetApp, [filePath], {
        detached: true,
        stdio: "ignore"
    });
    isOpenConfigFile = true;
    child.on("exit", () => {
        isOpenConfigFile = false;
    });
    child.unref();
    // spawn(targetApp, [filePath], {
    //     detached: true,
    //     stdio: "ignore"
    // }).unref();
}
function openAppConfigFile() {
    openFile(filePathForAppConfig, "notepad");
}

function appConfig() {
    printAppConfigDetails();
    if (config.OPEN_CONFIG_FILE_WHILE_CHECKING_CONFIG) {
        openAppConfigFile();
    }
}

module.exports = { appConfig };
