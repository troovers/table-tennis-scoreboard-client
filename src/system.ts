import { exec } from "child_process";

export class System {
    static getSerialNumber() {
        return new Promise<string>((resolve, reject) => {
            exec('cat /proc/cpuinfo | grep Serial', (error: any, stdout: any, stderr: any) => {
                if (error) {
                    reject(error);
                    return;
                }

                let value = stdout;
                resolve(value.split(":")[1].trim());
            });
        });
    }

    static getSSID() {
        return new Promise<string>((resolve, reject) => {
            if (process.env.ENV !== 'production') {
                resolve('WiFi');
                return;
            }

            exec('iwgetid', (error: any, stdout: any, stderr: any) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(stdout);
            });
        });
    }

    static restart() {
        return new Promise<void>((resolve, reject) => {
            exec('sudo reboot', (error: any, stdout: any, stderr: any) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });
    }
}