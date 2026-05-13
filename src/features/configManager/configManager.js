const configManagerJson = require('./configManager.json');
const path = require('path');
const fs = require('fs');
const os = require('os');

// do not use clog in this file as this file itself is being used in clog, which can cause circular dependency issues. Use console for logging in this file if needed.
// const clog = require('#shared/clog-with-fallback');
const _DEBUG_LOG_ENABLED = false; // set to true to enable debug logs in this file

// const configManagerData = Array.isArray(configManagerJson.data) ? configManagerJson.data : [];
const configManagerData = configManagerJson.data || {};
const filesToBeShadowed = Array.isArray(configManagerData.filesToBeShadowed)
    ? configManagerData.filesToBeShadowed
    : [];
const shadowFolderUnderUserHome = typeof configManagerData.shadowFolderUnderUserHome === 'string' && configManagerData.shadowFolderUnderUserHome.length
    ? configManagerData.shadowFolderUnderUserHome
    : '__cyk';

// helpers
const _helpers = {
    // path for user-machine e.g. c:/users/<user-name>/
    userHomePath: os.homedir(),
    projectRoot: path.dirname(require.resolve('#root/package.json')),
    localShadowOfProjectRoot: path.join(os.homedir(), shadowFolderUnderUserHome, ...require('#root/package.json').name.split('/')),
    getLocalShadowOfProjectRoot: function () {
        return _helpers.localShadowOfProjectRoot;
    }
};

function createShadowOfAllConfigFiles() {
    // The actual config manager code will be implemented in this file later.
    _DEBUG_LOG_ENABLED && console.debug("createShadowOfAllConfigFiles...");
    _DEBUG_LOG_ENABLED && console.debug(" - userHomePath:", _helpers.userHomePath); // C:\Users\<user-name>
    _DEBUG_LOG_ENABLED && console.debug(" - path for project root (not the current directory):", _helpers.projectRoot); // D:\kk\kk_c_t\__kk100github\pater
    _DEBUG_LOG_ENABLED && console.debug(" - local shadow of project root:", _helpers.localShadowOfProjectRoot); // C:\Users\<user-name>\__cyk\@kundan100\pater
    _DEBUG_LOG_ENABLED && console.debug("filesToBeShadowed.length: ", filesToBeShadowed.length);
    for (const configItem of filesToBeShadowed) {
        _DEBUG_LOG_ENABLED && console.debug(` - Config File Path (in json): ${configItem.filePath}, Config ID: ${configItem.id}`); // - Config File Path (in json): /config.json, Config ID: appConfig
        // source file
        const sourceFilePath = path.resolve(path.join(_helpers.projectRoot, configItem.filePath));
        _DEBUG_LOG_ENABLED && console.debug(` - sourceFilePath: ${sourceFilePath}`); // - sourceFilePath: D:\kk\kk_c_t\__kk100github\pater\config.json
        // ensure source file exists
        if (!fs.existsSync(sourceFilePath)) {
            _DEBUG_LOG_ENABLED && console.warn(`Source file not found for config ID "${configItem.id}" at path: ${sourceFilePath}. Skipping this config item.`);
            continue; // skip to the next config item
        }
        // destination file
        const destinationFilePath = path.join(_helpers.localShadowOfProjectRoot, configItem.filePath);
        // Ensure destination folders exist
        fs.mkdirSync(
            path.dirname(destinationFilePath),
            { recursive: true }
        );
        _DEBUG_LOG_ENABLED && console.debug(` - destinationFilePath: ${destinationFilePath} --- exists or created (if not existed)`); // - destinationFilePath: C:\Users\<user-name>\__cyk\@kundan100\pater\config.json --- exists or created (if not existed)
        // Skip copying if file already exists
        if (fs.existsSync(destinationFilePath)) {
            _DEBUG_LOG_ENABLED && console.debug(
                `Shadow file already exists for config ID "${configItem.id}". Skipping copy: ${destinationFilePath}`
            );
            continue;
        }
        // Copy file
        fs.copyFileSync(sourceFilePath, destinationFilePath);
        _DEBUG_LOG_ENABLED && console.log(`Copied config file for config ID "${configItem.id}" to local shadow: ${destinationFilePath}`); // Copied config file for config ID "appConfig" to local shadow: C:\Users\<user-name>\__cyk\@kundan100\pater\config.json
    }
}

function loadConfigJsonWithSynchedShadow(filePath) {
    //
    _DEBUG_LOG_ENABLED && console.debug('loadConfigJsonWithSynchedShadow...');
    // print file-path received as-is ('#root/config.json')
    _DEBUG_LOG_ENABLED && console.debug(` - Received filePath: ${filePath}`);
    // print the resolved absolute path
    // if caller already passed an absolute path (e.g. via require.resolve at callsite), use it directly
    const resolvedPath = path.isAbsolute(filePath) ? filePath : require.resolve(filePath);
    _DEBUG_LOG_ENABLED && console.debug(` - Resolved absolute path: ${resolvedPath}`);
    // print relative-path from project root
    const relativePathFromProjectRoot = path.relative(_helpers.projectRoot, resolvedPath);
    _DEBUG_LOG_ENABLED && console.debug(` - Relative path from project root: ${relativePathFromProjectRoot}`);
    // construct shadow path
    const shadowPath = path.join(_helpers.localShadowOfProjectRoot, relativePathFromProjectRoot);
    _DEBUG_LOG_ENABLED && console.debug(` - Constructed shadow path: ${shadowPath}`);
    // load both the original and shadow config files and merge them (with shadow taking precedence).
    let originalFile = {};
    let shadowFile = {};
    // load original file
    if (fs.existsSync(resolvedPath)) {
        originalFile = require(resolvedPath);
        _DEBUG_LOG_ENABLED && console.debug(` - Loaded original config file from: ${resolvedPath}`);
    } else {
        _DEBUG_LOG_ENABLED && console.warn(`Original config file not found at: ${resolvedPath}`);
    }
    // load shadow file
    if (fs.existsSync(shadowPath)) {
        shadowFile = require(shadowPath);
        _DEBUG_LOG_ENABLED && console.debug(` - Loaded shadow config file from: ${shadowPath}`);
    } else {
        _DEBUG_LOG_ENABLED && console.warn(`Shadow config file not found at: ${shadowPath}`);
    }
    // merge with shadow taking precedence
    const mergedFile = { ...originalFile, ...shadowFile };
    _DEBUG_LOG_ENABLED && console.debug(` - Merged file (shadow takes precedence over original):`, mergedFile);
    // update shadow file if there are any differences (to keep them synched)
    // below code works but needs to be tested more before enabling it, so commenting it out for now. The idea is to keep the shadow file synched with the original file (with shadow taking precedence in case of differences), so that user can edit either the original file or the shadow file and the changes will be reflected in both places when this function is called.
    // if (JSON.stringify(originalFile) !== JSON.stringify(shadowFile)) {
    //     // before overwriting the shadow file with merged file content, 
    //     // create a backup of the existing shadow file (if exists) with a timestamp in the name,
    //     // so that user can refer back to it if needed.
    //     if (fs.existsSync(shadowPath)) {
    //         const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    //         fs.copyFileSync(shadowPath, `${shadowPath}.${timestamp}`);
    //     }
    //     // now write the merged content to the shadow file, 
    //     // so that it is synched with the original file (with shadow taking precedence in case of differences).
    //     fs.writeFileSync(shadowPath, JSON.stringify(mergedFile, null, 2), 'utf-8');
    // }
    return mergedFile;
}

module.exports = { createShadowOfAllConfigFiles, loadConfigJsonWithSynchedShadow, getLocalShadowOfProjectRoot: _helpers.getLocalShadowOfProjectRoot };