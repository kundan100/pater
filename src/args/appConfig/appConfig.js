#!/usr/bin/env node
// appConfig helper — encapsulates logic for printing app's config file details
const path = require('path');
const config  = require('#config');

// config file path (the path for user after installation)
const filePathForAppConfig = require.resolve('#config');

function printAppConfigDetails() {
    console.log("App's config file details:");
    console.log(" - file path:", filePathForAppConfig);
    console.log(" - config object:", config);
    console.log("Update 'userConfig' manually in config.js to match your environment (e.g. repo paths), then use this command to verify the details.");
}
function openAppConfigFile() {
    const open = require('open');
    open(filePathForAppConfig);
}

function appConfig() {
    printAppConfigDetails();
    openAppConfigFile();
}

module.exports = { appConfig };
