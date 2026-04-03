#!/usr/bin/env node

// ensure colors are enabled even when stdout is piped through npm's .cmd shim on Windows
// this is to show color outputs in terminal
process.env.FORCE_COLOR = process.env.FORCE_COLOR || '1';

const handleArgs = require('#args/handleArgs');
const clog = require('#shared/clog-with-fallback');

// startup banner — shown every time the CLI is invoked
clog.log('Welcome pater!');

// capture CLI arguments (excluding `node` and script path)
const args = process.argv.slice(2);

// run the handler; it returns an object { handled: boolean, code?: number }
const result = handleArgs(args) || { handled: false };

if (!result.handled) {
    // main owns the default action: show interactive menu
    const { handleMenu } = require('#menu/index');
    handleMenu()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
} else {
    // if handled, exit with the handler-provided code (or 0)
    process.exit(result.code || 0);
}

