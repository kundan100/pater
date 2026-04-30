#!/usr/bin/env node
// appConfig helper — encapsulates logic for printing app's config file details
const config = require('#config');
const { openFile } = require('#shared/openFile');

// config file path (the path for user after installation)
const filePathForAppConfig = require.resolve('#config');

function printAppConfigDetails() {
    console.log("App's config file details:");
    console.log(" - file path:", filePathForAppConfig);
    console.log(" - config object:", config);
    console.log("Update 'userConfig' manually in config.js to match your environment (e.g. repo paths), then use this command to verify the details.");
}

async function openAppConfigFile() {
    // openFile(filePathForAppConfig, 'notepad'); // for testing with notepad-app
    return openFile(filePathForAppConfig, '');
}

async function appConfig() {
    printAppConfigDetails();
    if (config.OPEN_CONFIG_FILE_WHILE_CHECKING_CONFIG) {
        await openAppConfigFile();
    }
}

module.exports = { appConfig };
