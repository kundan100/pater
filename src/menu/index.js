const menuItems = require('./menu.json');

const config = require('#config');
const { copyAll } = require(`#features/copy-local-changes/${config.SELECTED_APPROACH.COPY_LOCAL_CHANGES}`);
const { killPort } = require('#features/killPorts/killPort');
const { clearTempFiles } = require('#features/system/clearTempFiles');
const { createRl } = require('#shared/askForUserEntry');
const clog = require('#shared/clog-with-fallback');

// actions are provided via `_helpers.menuHandlers` for clarity and testability

const _helpers = {
  printMenu: function () {
    clog.info('\nPlease choose an option:');
    menuItems.forEach((it, idx) => {
      const label = it && it.label ? it.label : String(it);
      clog.log(`  ${idx + 1}. ${label}`);
    });
  },

  // ask prompts the user using the provided readline instance and resolver
  ask: function (rl, resolve) {
    rl.question(`\nSelect an option (1-${menuItems.length}): `, (answer) => {
      const n = Number(answer && answer.trim());
      return _helpers.processSelection(n, rl, resolve);
    });
  },

  // factory that returns a raw stdin data handler for this run
  createOnData: function (rl, resolve) {
    let buffer = '';
    const handler = (chunk) => {
      buffer += String(chunk);
      // on first newline, try to process selection
      if (buffer.indexOf('\n') !== -1) {
        // mark that we've received input so the fallback timeout won't re-prompt
        handler.processed = true;
        const line = buffer.split(/\r?\n/)[0];
        // remove listener to avoid duplicate handling
        process.stdin.removeListener('data', handler);
        // directly process the value
        const n = Number(line && line.trim());
        if (Number.isInteger(n) && n >= 1 && n <= menuItems.length) {
          return _helpers.processSelection(n, rl, resolve);
        }
        // if invalid, fall back to interactive ask (may or may not work)
        clog.warn('Invalid selection from stdin, falling back to interactive prompt.');
        _helpers.ask(rl, resolve);
      }
    };
    return handler;
  },

  // centralized selection processing to avoid duplication between ask and createOnData
  processSelection: function (n, rl, resolve) {
    if (!Number.isInteger(n) || n < 1 || n > menuItems.length) {
      clog.warn('Invalid selection, please try again.');
      return _helpers.ask(rl, resolve);
    }
    const item = menuItems[n - 1];
    const selectionLabel = item && item.label ? item.label : String(item);
    const invoke = () => {
      // dispatch by the menu item's `key` so ordering in menu.json can change
      const key = item && item.key ? item.key : null;
      clog.info(`\nYou selected: ${selectionLabel} (key: ${key})`);
      if (key && typeof _helpers.menuHandlers[key] === 'function') {
        return _helpers.menuHandlers[key](item, rl);
      }
      // helpful fallback message when a menu key has no handler
      clog.warn(`\nYou selected: ${selectionLabel}; no handler defined for key '${key}'`);
      return undefined;
    };
    return Promise.resolve(invoke()).then(() => {
      rl.close();
      resolve();
    });
  },

  // named handlers for each menu item; keyed by `menu.json` item `key`.
  menuHandlers: {
    status: (item) => { clog.log(`\n[handler] ${item.label} - status: OK`); },
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
          // run dry-run to avoid accidental writes; module logs its progress
          copyAll({ dryRun: false, verbose: true });
          clog.log('\n[handler] copy_local_changes - done');
        } catch (err) {
          clog.error('\n[handler] copy_local_changes error:', err && err.message ? err.message : err);
        }
      })();
    }
    ,
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

function handleMenu() {
  return new Promise((resolve) => {
    // print the menu
    _helpers.printMenu();

    // if stdin is not a TTY we still attempt to read a selection from stdin
    // some environments report false for isTTY but still accept keyboard input
    if (!process.stdin.isTTY) {
      clog.log('\nNote: stdin is not a TTY. If your terminal supports input, type a number and press Enter.');
    }

    const rl = createRl();

    // use helper.ask which takes `(rl, resolve)`

    // if stdin is not a TTY, also listen for raw data in case the environment
    // doesn't drive readline prompts visibly but sends data to stdin.
    if (!process.stdin.isTTY) {
      // create an onData handler scoped per-run via helper factory so it's
      // easier to test and reason about.
      const onData = _helpers.createOnData(rl, resolve);

      // resume stdin and wait briefly for data; if none arrives, open the
      // interactive prompt which will still try to read input if possible.
      try {
        process.stdin.resume();
        process.stdin.on('data', onData);
        // give a short grace period for piped input to arrive
        setTimeout(() => {
          if (onData.processed) return;
          process.stdin.removeListener('data', onData);
          // if nothing processed yet, try interactive ask
          _helpers.ask(rl, resolve);
        }, 250);
      } catch (err) {
        _helpers.ask(rl, resolve);
      }
    } else {
      _helpers.ask(rl, resolve);
    }
  });
}

module.exports = { handleMenu, menuItems };
