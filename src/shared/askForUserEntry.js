const readline = require('readline');

function createRl() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function askForUserEntry(promptText, rl) {
  if (rl) {
    return new Promise((resolve) => {
      rl.question(promptText, (answer) => resolve((answer || '').trim()));
    });
  }
  const _rl = createRl();
  return new Promise((resolve) => {
    _rl.question(promptText, (answer) => {
      _rl.close();
      resolve((answer || '').trim());
    });
  });
}

module.exports = { createRl, askForUserEntry };
