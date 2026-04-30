#!/usr/bin/env node

async function handleArgs(args) {
  // parse flags
  const helpRequested = args.includes('-h') || args.includes('--help');
  const versionRequested = args.includes('--version') || args.includes('-v');
  const appConfigDetailsRequested = args.includes('--config');
  const verboseRequested = args.includes('--verbose');
  const echoRequested = args.includes('--echo');
  // use a switch over booleans for clearer single-dispatch handling
  switch (true) {
    case helpRequested: {
      // delegate help printing to dedicated module
      const { printHelp } = require('./appHelp/appHelp');
      printHelp();
      return { handled: true, code: 0 };
    }
    case versionRequested: {
      // delegate version printing to dedicated module
      const { printVersion } = require('./appVersion/appVersion');
      printVersion();
      return { handled: true, code: 0 };
    }
    case appConfigDetailsRequested: {
      // delegate app config details printing to dedicated module
      const { appConfig } = require('./appConfig/appConfig');
      await appConfig();
      return { handled: true, code: 0 };
    }
    case echoRequested: {
      // delegate echo handling to dedicated module
      const { runEcho } = require('./appEcho/appEcho');
      const echoIndex = args.indexOf('--echo');
      const msg = args[echoIndex + 1];
      const code = runEcho(msg, verboseRequested);
      return { handled: true, code };
    }
    default:
      // not handled here — caller (main) should perform default action
      return { handled: false, code: 0 };
  }
}

module.exports = handleArgs;
