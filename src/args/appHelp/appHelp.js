#!/usr/bin/env node
// appHelp helper — encapsulates logic for printing CLI help text
function printHelp() {
  console.log(`pater — helper script
Usage: pater [options]

Options:
  -h, --help        Show this help message
  -v, --version     Print version
  --config          Print path to app's config file
  --verbose         Print verbose debug info
  --echo <message>  Echo the provided message
`);
}

module.exports = { printHelp };
