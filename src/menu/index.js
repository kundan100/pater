const { loadConfigJsonWithSynchedShadow } = require('#root/src/features/shadowManager/shadowManager.js');
const appConfigJson = loadConfigJsonWithSynchedShadow(require.resolve('#root/config.json'));
const menuConfigJson = loadConfigJsonWithSynchedShadow(require.resolve('./menuConfig.json'));
const { copyAll } = require(`#features/copyLocalChanges/${appConfigJson.data.SELECTED_APPROACH.COPY_LOCAL_CHANGES}`);
const { killPort } = require('#features/killPorts/killPort');
const { clearTempFiles } = require('#features/system/clearTempFiles');
const { systemStatus } = require('#features/systemStatus/index');
const { askForUserEntry } = require('#shared/askForUserEntry');
const clog = require('#shared/clog-with-fallback');
const { runExternalAction } = require('./externalActionRunner');

const menuItems = Array.isArray(menuConfigJson.data) ? menuConfigJson.data : [];
// this array will hold the menu items that are enabled for the current run
const enabledMenuItems = [];

// actions are provided via `_helpers.menuHandlers` for clarity and testability
const _helpers = {
  setEnabledMenuItems: function () {
    // clog.info('processMenuItems:');
    // filter out disabled items and log the available menu items for debugging
    menuItems.forEach((item, idx) => {
      if (item.enabled) {
        enabledMenuItems.push(item);
      }
    });
    // clog.info('Enabled menu items:');
    // enabledMenuItems.forEach((item, idx) => {
    //   clog.log(`  ${idx + 1}. ${item.label}`);
    // });
  },

  printMenu: function () {
    clog.info('\nPlease choose an option:');
    enabledMenuItems.forEach((it, idx) => {
      const label = it && it.label ? it.label : String(it);
      clog.log(`  ${idx + 1}. ${label}`);
    });
    clog.info('press x to exit;');
  },

  // handleSelection handles all input-parsing and dispatch for a single user entry.
  // Returns true when the menu loop should exit, false to re-prompt.
  handleSelection: async function (n) {
    // handle special single-char commands
    if (String(n).toLowerCase() === 'x') {
      clog.log('Exiting per user request.');
      return true;
    }
    // m / b reserved for future menu navigation — ignore for now
    if (String(n).toLowerCase() === 'm' || String(n).toLowerCase() === 'b') {
      return false;
    }

    const num = Number(n);
    if (!Number.isInteger(num) || num < 1 || num > enabledMenuItems.length) {
      clog.warn('Invalid selection, please try again.');
      return false;
    }

    // valid selection — dispatch to handler
    const item = enabledMenuItems[num - 1];
    const key = item && item.key ? item.key : null;
    const selectionLabel = item && item.label ? item.label : String(item);
    clog.info(`\nYou selected: ${selectionLabel} (key: ${key})`);

    // first try external action (local machine scope)
    try {
      const handled = await runExternalAction(item);
      if (handled) return true;
    } catch (e) {
      clog.error(`Error running external action for item '${selectionLabel}':`, e && e.message ? e.message : e);
      return true;
    }

    // internal handler
    if (key && typeof _helpers.menuHandlers[key] === 'function') {
      await _helpers.menuHandlers[key](item);
      return true;
    }

    clog.warn(`\nYou selected: ${selectionLabel}; no handler defined for key '${key}'`);
    return true;
  },

  // named handlers for each menu item; keyed by `menuConfig.json` item `key`.
  menuHandlers: {
    status: (item) => {
      clog.log(`\n[handler] ${item.label} - status: OK`);
      systemStatus();
    },
    start: (item) => { clog.info(`\n[handler] ${item.label} - starting...`); },
    stop: (item) => { clog.warn(`\n[handler] ${item.label} - stopping...`); },
    exit: (item) => { clog.log(`\n[handler] ${item.label} - exiting.`); },
    kill_port: (item) => {
      return (async () => {
        try {
          // let killPort prompt for a port itself when called without args
          const result = await killPort();
          clog.log('\n[handler] killPort result:', result);
        } catch (err) {
          clog.error('\n[handler] killPort error:', err && err.message ? err.message : err);
        }
      })();
    },
    copy_local_changes: (item) => {
      return (async () => {
        try {
          clog.info('\n[handler] copy_local_changes - running');
          // run and await copyAll so interactive prompts (openFile/ask) work
          await copyAll({ dryRun: false, verbose: true });
          clog.log('\n[handler] copy_local_changes - done');
        } catch (err) {
          clog.error('\n[handler] copy_local_changes error:', err && err.message ? err.message : err);
        }
      })();
    },
    clear_temp_files: (item) => {
      return (async () => {
        try {
          // run with real effect; change options here if you want dry-run or different age
          const result = await clearTempFiles({ dryRun: false, maxAgeHours: 72 });
          clog.log('\n[handler] clear_temp_files result:', result);
        } catch (err) {
          clog.error('\n[handler] clear_temp_files error:', err && err.message ? err.message : err);
        }
      })();
    }
  }
};

async function handleMenu() {
  _helpers.setEnabledMenuItems();
  _helpers.printMenu();

  if (!process.stdin.isTTY) {
    clog.log('\nNote: stdin is not a TTY. If your terminal supports input, type a number and press Enter.');
  }

  // loop until a valid selection or explicit exit
  while (true) {
    const raw = await askForUserEntry(`\nSelect an option (1-${enabledMenuItems.length}): `);
    const done = await _helpers.handleSelection(raw && raw.trim());
    if (done) return;
  }
}

module.exports = { handleMenu };
