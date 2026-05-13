#!/usr/bin/env node
// appConfig helper — encapsulates logic for printing app's config file details
const pkg = require('#root/package.json');
const { loadConfigJsonWithSynchedShadow, getLocalShadowOfProjectRoot } = require('#features/configManager/configManager');
const appConfigJson = loadConfigJsonWithSynchedShadow('#root/config.json');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { openFile } = require('#shared/openFile');
const clog = require('#shared/clog-with-fallback');

// use console in place of clog for file-content printing as clog is just printing [object object]
// console.debug('[/src/args/appConfig/appConfig.js] Loaded appConfigJson:', appConfigJson);
console.debug('[/src/args/appConfig/appConfig.js] appConfigJson.data.OPEN_CONFIG_FILE_WHILE_CHECKING_CONFIG:', appConfigJson.data.OPEN_CONFIG_FILE_WHILE_CHECKING_CONFIG);

// path for user-machine e.g. c:/users/<user-name>/
const userHomePath = os.homedir();
// clog.debug(" - userHomePath:", userHomePath);

// config file path (the path for user after installation)
const filePathForAppConfig = require.resolve('#root/config.json');

function printAppConfigDetails() {
    clog.log("App's config file details:");
    clog.log(" - file path:", filePathForAppConfig);
    clog.log(" - config object:", appConfigJson);
    clog.log(" - Update '/config.json' manually to match your environment (e.g. repo paths), then use this command to verify the details.");
    // print details of localAppConfigShadow
    clog.log("localAppconfigShadow file details:");
    clog.log(" - userHomePath:", userHomePath);
    // clog.log(" - localAppConfigShadow path:", path.join(userHomePath, '__cyk', ...pkg.name.split('/'), 'config.json'));
    clog.log(" - localAppConfigShadow path:", path.join(getLocalShadowOfProjectRoot(), 'config.json'));
}

async function openAppConfigFile() {
    // openFile(filePathForAppConfig, 'notepad'); // for testing with notepad-app
    return openFile(filePathForAppConfig, '');
}

async function appConfig() {
    printAppConfigDetails();
    if (appConfigJson.data.OPEN_CONFIG_FILE_WHILE_CHECKING_CONFIG) {
        await openAppConfigFile();
    }
}

module.exports = { appConfig };
