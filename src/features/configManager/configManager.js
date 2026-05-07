const configManagerJson = require('./configManager.json');
const path = require('path');
const fs = require('fs');
const os = require('os');
const clog = require('#shared/clog-with-fallback');

// helpers
const _helpers = {
    // path for user-machine e.g. c:/users/<user-name>/
    userHomePath: os.homedir(),
    projectRoot: path.dirname(require.resolve('#root/package.json')),
    localShadowOfProjectRoot: path.join(os.homedir(), '__cyk', ...require('#root/package.json').name.split('/'))
};

function createShadowOfAllConfigFiles() {
    // The actual config manager code will be implemented in this file later.
    clog.debug("createShadowOfAllConfigFiles...");
    clog.debug(" - userHomePath:", _helpers.userHomePath); // C:\Users\<user-name>
    clog.debug(" - path for project root (not the current directory):", _helpers.projectRoot); // D:\kk\kk_c_t\__kk100github\pater
    clog.debug(" - local shadow of project root:", _helpers.localShadowOfProjectRoot); // C:\Users\<user-name>\__cyk\@kundan100\pater
    clog.debug("configManagerJson.length: ", configManagerJson.length);
    for (const configItem of configManagerJson) {
        clog.debug(` - Config File Path (in json): ${configItem.filePath}, Config ID: ${configItem.id}`); // - Config File Path (in json): /config.json, Config ID: appConfig
        // source file
        const sourceFilePath = path.resolve(path.join(_helpers.projectRoot, configItem.filePath));
        clog.debug(` - sourceFilePath: ${sourceFilePath}`); // - sourceFilePath: D:\kk\kk_c_t\__kk100github\pater\config.json
        // ensure source file exists
        if (!fs.existsSync(sourceFilePath)) {
            clog.warn(`Source file not found for config ID "${configItem.id}" at path: ${sourceFilePath}. Skipping this config item.`);
            continue; // skip to the next config item
        }
        // destination file
        const destinationFilePath = path.join(_helpers.localShadowOfProjectRoot, configItem.filePath);
        // Ensure destination folders exist
        fs.mkdirSync(
            path.dirname(destinationFilePath),
            { recursive: true }
        );
        clog.debug(` - destinationFilePath: ${destinationFilePath} --- exists or created (if not existed)`); // - destinationFilePath: C:\Users\<user-name>\__cyk\@kundan100\pater\config.json --- exists or created (if not existed)
        // Skip copying if file already exists
        if (fs.existsSync(destinationFilePath)) {
            clog.debug(
                `Shadow file already exists for config ID "${configItem.id}". Skipping copy: ${destinationFilePath}`
            );
            continue;
        }
        // Copy file
        fs.copyFileSync(sourceFilePath, destinationFilePath);
        clog.log(`Copied config file for config ID "${configItem.id}" to local shadow: ${destinationFilePath}`); // Copied config file for config ID "appConfig" to local shadow: C:\Users\<user-name>\__cyk\@kundan100\pater\config.json
    }
}

module.exports = { createShadowOfAllConfigFiles };