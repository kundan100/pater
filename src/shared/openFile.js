/**
 * openFile.js - Cross-platform file opener with smart editor selection
 * 
 * PURPOSE:
 * Provides a reusable, robust way to open files across platforms (Windows, macOS, Linux).
 * Handles platform-specific edge cases like Windows .js file associations and VS Code path resolution.
 * 
 * KEY FEATURES:
 * - Windows .js files: prompts user to choose notepad, vscode, or cancel (avoids Windows Script Host)
 * - VS Code fallback: checks local LOCALAPPDATA install path if 'code' CLI is not available
 * - Cross-platform: uses 'open' package on macOS/Linux, cmd /c start on Windows for default apps
 * - Detached process: spawns editor in background without blocking the CLI
 * - Single-open guard: prevents multiple simultaneous file opens
 * 
 * USAGE (from other modules):
 * const { openFile } = require('#shared/openFile');
 * 
 * // Basic usage (opens with default app)
 * await openFile('/path/to/file.txt');
 * 
 * // With specific app
 * await openFile('/path/to/file.js', 'notepad');
 * 
 * // For .js files on Windows, user will be prompted to choose editor
 * await openFile('/path/to/config.js'); // → prompts: "open in notepad, vscode, or cancel?"
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { askForUserEntry } = require('#shared/askForUserEntry');

// get path of vscode
const localAppDataPath = process.env.LOCALAPPDATA || '';
const vsCodeBasePath = path.join(localAppDataPath, 'Programs', 'Microsoft VS Code');
const vsCodeInsidersBasePath = path.join(localAppDataPath, 'Programs', 'Microsoft VS Code Insiders');
const localVsCodePaths = {
    vsCodeExe: path.join(
        vsCodeBasePath,
        'Code.exe'
    ),
    vsCodeCmd: path.join(
        vsCodeBasePath,
        'bin',
        'code.cmd'
    ),
    vsCodeInsidersExe: path.join(
        vsCodeInsidersBasePath,
        'Code.exe'
    ),
    vsCodeInsidersCmd: path.join(
        vsCodeInsidersBasePath,
        'bin',
        'code.cmd'
    )
};

let isOpenFileActive = false;

async function openFile(filePath, targetApp = '') {
  console.log('cyk--10-1 > openFile', { filePath, targetApp, isOpenFileActive });

  if (isOpenFileActive) {
    console.log('File already opened.');
    return;
  }

  let child;
  let selectedApp = targetApp;

  if (!selectedApp && process.platform === 'win32' && path.extname(filePath).toLowerCase() === '.js') {
    const answer = await askForUserEntry(
      'This is a .js file. open in notepad, vscode, or cancel? [notepad/vscode/cancel]: '
    );
    const normalized = (answer || '').trim().toLowerCase();

    if (normalized === 'vscode' || normalized === 'code') {
      if (fs.existsSync(localVsCodePaths.vsCodeExe)) {
        selectedApp = localVsCodePaths.vsCodeExe;
      } else if (fs.existsSync(localVsCodePaths.vsCodeCmd)) {
        selectedApp = localVsCodePaths.vsCodeCmd;
      } else if (fs.existsSync(localVsCodePaths.vsCodeInsidersExe)) {
        selectedApp = localVsCodePaths.vsCodeInsidersExe;
      } else if (fs.existsSync(localVsCodePaths.vsCodeInsidersCmd)) {
        selectedApp = localVsCodePaths.vsCodeInsidersCmd;
      } else {
        selectedApp = 'code';
      }
    } else if (normalized === 'notepad' || normalized === 'n') {
      selectedApp = 'notepad';
    } else {
      console.log('Open cancelled. No editor was launched.');
      return;
    }
  }

  if (selectedApp) {
    child = spawn(selectedApp, [filePath], {
      detached: true,
      stdio: 'ignore'
    });
  } else if (process.platform === 'win32') {
    child = spawn('cmd', ['/c', 'start', '', filePath], {
      detached: true,
      stdio: 'ignore'
    });
  } else {
    try {
      const _open = (await import('open')).default;
      child = await _open(filePath, { wait: false });
    } catch (err) {
      console.log('cyk--10-1 > default open failed, falling back to xdg-open:', err);
      child = spawn('xdg-open', [filePath], {
        detached: true,
        stdio: 'ignore'
      });
    }
  }

  console.log('cyk--10-1- opened file successfully:', filePath, child ? `(pid: ${child.pid})` : '(no child process)');
  isOpenFileActive = true;

  if (child && typeof child.on === 'function') {
    child.on('exit', () => {
      isOpenFileActive = false;
    });
  }

  if (child && typeof child.unref === 'function') {
    child.unref();
  }

  return child;
}

async function openFile__OLD(filePath, targetApp) {
    // approach-1
    // const open = require('open');
    // open(filePathForAppConfig);
    // approach-2
    // try {
    //     const open = (await import('open')).default;
    //     await open(filePath);
    //     console.log("Opened file successfully:", filePath);
    // } catch (err) {
    //     require('child_process').spawn('notepad', [filePath]);
    //     console.log("Error opening file:", err);
    // }
    // approach-3
    // try {
    //     const open = (await import('open')).default;
    //     await open(filePath, { app: { name: 'notepad' } });
    // } catch {
    //     spawn("notepad", [filePath], {
    //         detached: true,
    //         stdio: "ignore"
    //     }).unref();
    // }
    // approach-4
    // const { exec } = require("child_process");
    // exec(`start "" "${filePathForAppConfig}"`);
    //approach-5
    // spawn("cmd", ["/c", "start", "", filePathForAppConfig], {
    //     detached: true,
    //     stdio: "ignore",
    //     shell: true
    // }).unref();
}

module.exports = { openFile };
