const os = require('os');
const { machineInfo } = require('#features/systemStatus/systemInfo/machineInfo');
const clog = require('#shared/clog-with-fallback');

function systemInfo() {
    machineInfo();
}



module.exports = { systemInfo };