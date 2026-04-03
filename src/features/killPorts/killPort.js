/*
Usage:
  # kill a single port
  node __cyk/scripts/killPorts/killPort.js <port>
  /*
  Usage:
    # kill a single port
    node __cyk/scripts/killPorts/killPort.js <port>
    node __cyk/scripts/killPorts/killPort.js 3011

    # dry-run (print what would be done)
    node __cyk/scripts/killPorts/killPort.js 3011 --dry-run

  Description:
    Kills a single port using `npx kill-port <port>` or prints the action
    when run with `--dry-run`/`-n`. Exports `killPort(port, { dryRun })`
    for programmatic use by other scripts.
  */
  const { exec } = require('child_process');
  const fs = require('fs');
  const path = require('path');

  const { askForUserEntry } = require('#shared/askForUserEntry');

  function runKill(port) {
    return new Promise((resolve, reject) => {
      if (process.platform === 'win32') {
        exec('netstat -ano', { cwd: process.cwd(), shell: true }, (err, stdout) => {
          if (err) return reject(err);
          const lines = stdout.split(/\r?\n/);
          const pids = new Set();
          for (const line of lines) {
            if (line.includes(`:${port}`)) {
              const parts = line.trim().split(/\s+/);
              const pid = parts[parts.length - 1];
              if (/^\d+$/.test(pid)) pids.add(pid);
            }
          }

          const result = { killed: [], alreadyKilled: [], failed: [] };
          if (pids.size === 0) return resolve(result);

          const tasks = Array.from(pids).map((pid) => {
            return new Promise((res) => {
              exec(`taskkill /PID ${pid} /F`, { cwd: process.cwd(), shell: true }, (e, so, se) => {
                const out = (so || '') + (se || '');
                if (!e) {
                  result.killed.push(pid);
                  return res();
                }
                const msg = (e && e.message) || out || String(e);
                // common message when process already gone
                if (/no running instance of the task|not found/i.test(out + msg)) {
                  result.alreadyKilled.push(pid);
                  return res();
                }
                result.failed.push({ pid, message: msg });
                return res();
              });
            });
          });

          Promise.all(tasks).then(() => resolve(result)).catch(reject);
        });
      } else {
        exec(`lsof -i :${port} -t`, { cwd: process.cwd(), shell: true }, (err, stdout, stderr) => {
          if (err) {
            if (err.code === 1) return resolve({ killed: [], alreadyKilled: [], failed: [] });
            return reject(err);
          }
          const pids = stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
          const result = { killed: [], alreadyKilled: [], failed: [] };
          if (pids.length === 0) return resolve(result);
          const tasks = pids.map((pid) => {
            return new Promise((res) => {
              exec(`kill -9 ${pid}`, { cwd: process.cwd(), shell: true }, (e, so, se) => {
                const out = (so || '') + (se || '');
                if (!e) {
                  result.killed.push(pid);
                  return res();
                }
                const msg = (e && e.message) || out || String(e);
                // ESRCH or 'No such process' indicates already gone
                if (/no such process|esrch/i.test(out + msg)) {
                  result.alreadyKilled.push(pid);
                  return res();
                }
                result.failed.push({ pid, message: msg });
                return res();
              });
            });
          });
          Promise.all(tasks).then(() => resolve(result)).catch(reject);
        });
      }
    });
  }

  async function killPort(port, { dryRun = false, rl = null } = {}) {
    // If caller didn't provide a port, prompt interactively when possible.
    // If a readline `rl` is provided, use it for prompting (works even when
    // process.stdin.isTTY may be false in some environments).
    if (!port) {
      if (rl) {
        port = await askForPort('No port provided. Enter port to kill: ', rl);
      } else {
        // attempt to prompt even when stdin is not a TTY; callers may pipe
        // input and readline will still read from stdin.
        port = await askForPort('No port provided. Enter port to kill: ');
      }
      if (!port) throw new Error('port is required');
    }
    if (dryRun) {
      // caller will handle dry-run output
      return { port, ok: true, message: 'dry-run' };
    }

    try {
      const r = await runKill(port);
      const failed = r.failed || [];
      const killed = r.killed || [];
      const alreadyKilled = r.alreadyKilled || [];
      const ok = failed.length === 0;
      const message = !ok ? failed.map((f) => `${f.pid}:${f.message}`).join('; ') : undefined;
      return { port, ok, killed, alreadyKilled, failed, message };
    } catch (err) {
      // normalize error
      const message = (err && err.message) || String(err);
      return { port, ok: false, killed: [], alreadyKilled: [], failed: [{ pid: '?', message }], message };
    }
  }

  module.exports = { killPort };

  // wrapper kept for compatibility; delegates to shared prompt helper
  function askForPort(promptText = 'Enter port to kill: ', rl) {
    return askForUserEntry(promptText, rl);
  }

  // CLI support
  if (require.main === module) {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run') || args.includes('-n');
    (async () => {
      try {
        let port = args.find((a) => !a.startsWith('-'));
        if (!port) {
          // delegate to the prompting helper
          port = await askForPort();
          if (!port) {
            console.error('No port provided; aborting.');
            return process.exit(1);
          }
        }

        await killPort(port, { dryRun });
        return process.exit(0);
      } catch (err) {
        console.error('killPort failed:', err && err.message ? err.message : err);
        return process.exit(1);
      }
    })();
  }
