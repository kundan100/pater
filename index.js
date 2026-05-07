#!/usr/bin/env node

// ensure colors are enabled even when stdout is piped through npm's .cmd shim on Windows
// this is to show color outputs in terminal
process.env.FORCE_COLOR = process.env.FORCE_COLOR || '1';

// const { loadLocalAppConfigShadow } = require('#args/appConfig/appConfig');
const { createShadowOfAllConfigFiles } = require('#features/configManager/configManager');
const handleArgs = require('#args/handleArgs');
const pkg = require('./package.json');
const clog = require('#shared/clog-with-fallback');

// startup banner — shown every time the CLI is invoked
clog.log(`Welcome pater (v${pkg.version})!`);

// create a local shadow of the app config in the user's home directory (e.g. c:/users/<user-name>/__cyk/.pater/config.js)
// this is where tool's config is shadowed as backup and will be loaded on each run of the tool, so that any changes to the config file are reflected without needing to restart the CLI
// loadLocalAppConfigShadow();
createShadowOfAllConfigFiles();

// capture CLI arguments (excluding `node` and script path)
const args = process.argv.slice(2);
clog.debug('[/index.js] args:', args);

// run the handler; it returns an object { handled: boolean, code?: number }
(async () => {
    try {
        const result = (await handleArgs(args)) || { handled: false };
        clog.debug('[/index.js] Result from handleArgs:', result);
        if (!result.handled) {
            // main owns the default action: show interactive menu
            const { handleMenu } = require('#menu/index');
            await handleMenu();
            process.exit(0);
        } else {
            // if handled (e.g. args like --help), exit with the handler-provided code (or 0)
            process.exit(result.code || 0);
        }
    } catch (err) {
        clog.error('[/index.js] Fatal error:', err);
        process.exit(1);
    }
})();

