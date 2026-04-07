const os = require('os');
const clog = require('#shared/clog-with-fallback');

const { execSync } = require('child_process');

function machineInfo() {
    clog.info('\nMachine info.....');
    _helpers.printMachineName();
    _helpers.printIPAddresses();
    _helpers.printRAM();
    _helpers.printOS();
    //
    _helpers.checkUsageThreshold();
    //
    // top 5 processes consuming high cpu 
    // _helpers.printTopCPUProcesses();
    // _helpers.printAllProcesses();
    _helpers.printTopHighestRAMProcesses();
}

const _helpers = {
    printMachineName: function() {
        const hostname = os.hostname();
        clog.log(`PC Name: ${hostname}`);
    },

    printOS: function() {
        const platform = os.platform();
        const release = os.release();
        clog.log(`Operating System: ${platform} ${release}`);
    },

    printRAM: function() {
        const totalMem = os.totalmem();
        clog.log(`Total RAM: ${Math.ceil(totalMem / (1024 * 1024 * 1024))} GB`);
        // utilized ram. os.freemem() can be used to get free RAM if desired
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        clog.log(`Used RAM: ${Math.ceil(usedMem / (1024 * 1024 * 1024))} GB`);
        clog.log(`Free RAM: ${Math.ceil(freeMem / (1024 * 1024 * 1024))} GB`);
    },

    printIPAddresses: function() {
        const interfaces = os.networkInterfaces();
        const addresses = [];
        for (const interfaceName in interfaces) {
            const interface = interfaces[interfaceName];
            for (const address of interface) {
                if (!address.internal && address.family === 'IPv4') {
                    addresses.push(address.address);
                }
            }
        }
        clog.log(`IP Addresses: ${addresses.join(', ')}`);
    },

    printTopCPUProcesses: function() {
        // not working on windows, need to find an alternative command for windows
        return;
        // read all process consuming high ram
        const { exec } = require('child_process');
        const cmd = process.platform === 'win32' ? 'wmic path Win32_PerfFormattedData_PerfProc_Process get Name,PercentProcessorTime /format:csv' : 'ps -eo pid,comm,%cpu --sort=-%cpu | head -n 6';
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                clog.error(`Error fetching CPU processes: ${error.message}`);
                return;
            }
            clog.log('Top CPU consuming processes:');
            clog.log(stdout);
        });
    },

    printAllProcesses: function() {
        // not working on windows, need to find an alternative command for windows
        return;
        const { exec } = require('child_process');
        const cmd = process.platform === 'win32' ? 'wmic path Win32_PerfFormattedData_PerfProc_Process get Name,PercentProcessorTime /format:csv' : 'ps -eo pid,comm,%cpu --sort=-%cpu';
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                clog.error(`Error fetching all processes: ${error.message}`);
                return;
            }
            clog.log('All processes:');
            clog.log(stdout);
        });
    },

    printTopHighestRAMProcesses: function() {
        // const { exec } = require('child_process');
        // clog.info("printTopHighestRAMProcesses_1");

        // exec(
        //     'powershell "Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5 Name,WorkingSet"',
        //     (err, stdout, stderr) => {
        //         clog.info("printTopHighestRAMProcesses_2");
        //         if (err) {
        //             console.error(err);
        //             return;
        //         }

        //         console.log('Top 5 RAM consuming processes:\n');
        //         console.log(stdout);
        //     }
        // );

        // const { execSync } = require('child_process');

        // try {
        //     const output = execSync('echo hello');
        //     console.log(output.toString());
        // } catch (e) {
        //     console.error(e);
        // }

        // const { execSync } = require('child_process');
        // keep it in sigle line. breaking the command in multiple line fails it.
        // const command = `powershell -Command "Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5 Name,WorkingSet"       `;
        // const command = `powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; @(Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10 Name,WorkingSet) | ConvertTo-Json -Compress"`;
        const command = `powershell -NoProfile -Command "$p = Get-Process | Sort-Object PM -Descending | Select-Object -First 10 Name,PM; $p | ConvertTo-Json -Compress"`;

        try {
            // Fetching processes
            clog.info('\nFetching top 10 RAM consuming processes.....');
            const output = execSync(
                command,
                { stdio: 'pipe', encoding: 'utf8' }
            );
            // Output the result
            // console.log(output.toString());
            const processes = JSON.parse(output.toString());
            // handle single object case
            if (!Array.isArray(processes)) {
                processes = [processes];
            }
            // print processes
            processes.forEach((p, i) => {
                clog.log(
                `${i + 1}. ${p.Name} - ${(p.PM / 1024 / 1024 / 1024).toFixed(1)} GB`
                );
            });
        } catch (e) {
            clog.error('ERROR:', e.message);
        }
    },

    getCPUUsage: function() {
        const command = `powershell -NoProfile -Command "(Get-Counter '\\Processor(_Total)\\% Processor Time').CounterSamples.CookedValue"`;
        const output = execSync(
            command,
            { encoding: 'utf8' }
        );
        return parseFloat(output.trim());
    },
    getRAMUsage: function() {
        const command = `powershell -NoProfile -Command "$os = Get-CimInstance Win32_OperatingSystem; (($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) * 100 / $os.TotalVisibleMemorySize)"`;
        const output = execSync(
            command,
            { encoding: 'utf8' }
        );
        return parseFloat(output.trim());
    },
    getDiskUsage: function() {
        const command = `powershell -NoProfile -Command "(Get-Counter '\\PhysicalDisk(_Total)\\% Disk Time').CounterSamples.CookedValue"`;
        const output = execSync(
            command,
            { encoding: 'utf8' }
        );
        return parseFloat(output.trim());
    },
    checkUsageThreshold: function() {
        try {
            clog.info('\nFetching usage % for cpu, ram, disk.....');
            const cpuUsage = this.getCPUUsage();
            const ramUsage = this.getRAMUsage();
            const diskUsage = this.getDiskUsage();
            const threshold = 80; // example threshold
            // console.log(`CPU: ${cpuUsage.toFixed(2)}%`);
            // console.log(`> CPU: ${cpuUsage.toFixed(2)}% \n> RAM: ${ramUsage.toFixed(2)}% \n> Disk: ${diskUsage.toFixed(2)}%`);
            console.log(`> CPU: ${Math.ceil(cpuUsage)}% \n> RAM: ${Math.ceil(ramUsage)}% \n> Disk: ${Math.ceil(diskUsage)}%`);
            if (cpuUsage > threshold) {
                console.log('🚨 High CPU usage!');
            }
            if (ramUsage > threshold) {
                console.log('🚨 High RAM usage!');
            }
            if (diskUsage > threshold) {
                console.log('🚨 High Disk usage!');
            }
        } catch (e) {
            console.error('Error:', e.message);
        }
        //
    }


};

module.exports = { machineInfo };