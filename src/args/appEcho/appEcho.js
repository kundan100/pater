#!/usr/bin/env node
// appEcho helper — encapsulates echo logic for the CLI
function runEcho(msg, verbose) {
  if (!msg) {
    console.error('Error: --echo requires a message');
    return 1;
  }
  if (verbose) console.error('[pater] echo mode (verbose)');
  console.log(msg);
  return 0;
}

module.exports = { runEcho };
