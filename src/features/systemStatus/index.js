const clog = require('#shared/clog-with-fallback');
const { systemInfo } = require('#features/systemStatus/systemInfo/index');

function systemStatus() {
//   clog.info('System status is currently not implemented. Please check back later!');
  systemInfo();
}

module.exports = { systemStatus };