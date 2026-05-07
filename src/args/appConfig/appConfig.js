#!/usr/bin/env node
// appConfig helper — encapsulates logic for printing app's config file details
const pkg = require('#root/package.json');
const { loadConfigJsonWithSynchedShadow } = require('#features/configManager/configManager');
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
    clog.log(" - localAppConfigShadow path:", path.join(userHomePath, '__cyk', ...pkg.name.split('/'), 'config.json'));
}

// function createLocalAppConfigShadow() {
//     // step-1: check if "__cyk" folder exists inside userHomePath, if not create it
//     const cykFolderPath = path.join(userHomePath, '__cyk');
//     if (!fs.existsSync(cykFolderPath)) {
//         fs.mkdirSync(cykFolderPath);
//     }
//     // step-2: check if "name-in-package.json" (e.g. @kundan100/pater) folder exists inside "__cyk", if not create it
//     const pkgName = pkg.name;
//     const pkgNameArray = pkgName.split('/');
//     let pkgFolderPath = cykFolderPath;
//     for (const part of pkgNameArray) {
//         if (!part || part.trim() === '') {
//             throw new Error(`Invalid package name: "${pkgName}". Package name should not be empty and should not contain consecutive slashes.`);
//         } else {
//             // valid part of package name
//             pkgFolderPath = path.join(pkgFolderPath, part);
//             if (!fs.existsSync(pkgFolderPath)) {
//                 fs.mkdirSync(pkgFolderPath);
//             }
//         }
//     }
//     // step-3: check if "config.js" file exists inside "name-in-package.json" folder, if not create it by copying from the tool's config.js
//     const localAppConfigShadowPath = path.join(pkgFolderPath, 'config.js');
//     if (!fs.existsSync(localAppConfigShadowPath)) {
//         fs.copyFileSync(filePathForAppConfig, localAppConfigShadowPath);
//         clog.debug(`Created local shadow of app config at: ${localAppConfigShadowPath}`);
//     } else {
//         clog.debug(`Local shadow of app config already exists at: ${localAppConfigShadowPath}`);
//     }
// }

function loadLocalAppConfigShadow() {
//     // this happens only once (i.e. on the first run of the tool) as the file is created if not exists,
//     createLocalAppConfigShadow();
//     // and on subsequent runs, it will be loaded without needing to create again
//     const localAppConfigShadowPath = path.join(userHomePath, '__cyk', ...pkg.name.split('/'), 'config.js');
//     if (fs.existsSync(localAppConfigShadowPath)) {
//         const localConfig = require(localAppConfigShadowPath);
//         // copy properties from localAppConfigShadow to config
//         Object.assign(config, localConfig);
//         clog.debug(`Loaded local shadow of app config from: ${localAppConfigShadowPath}`);
//     } else {
//         clog.warn(`Local shadow of app config not found at: ${localAppConfigShadowPath}. This should not happen as it should have been created if not exists.`);
//     }
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

module.exports = { appConfig, loadLocalAppConfigShadow };
