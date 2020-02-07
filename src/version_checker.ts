import { exec } from "child_process";
const semver = require('semver');
var fs = require('fs');

export class VersionChecker {
    async updateAvailable() {
        try {
            let current = await this.currentVersion();
            let latest = await this.latestVersion();

            console.info(`Current version is: ${current}`);
            console.info(`Latest version is: ${latest}`);

            return semver.gt(latest, current);
        } catch (error) {
            console.error(`Error checking version: ${error}`);
            return false;
        }
    }

    async update() {
        let latest: string;

        try {
            latest = await this.latestVersion();
        } catch (error) {
            console.error(`Error updating: ${error}`);
            return;
        }

        console.info(`Going to update to: ${latest}`);
        console.info(`git fetch && git checkout tags/${latest} && npm run build`);

        return new Promise<void>((resolve, reject) => {
            exec(`git fetch && git checkout tags/${latest} && npm install && npm run build`, (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.error(`Error updating to latest tag: ${error}`);
                    reject(error);
                    return;
                }

                // Write the new tag to the file
                fs.writeFileSync('../.tag', latest);

                console.info(stdout);

                resolve();
            });
        });
    }

    private currentVersion() {
        return new Promise<string>((resolve, reject) => {
            try {
                let tag = fs.readFileSync('../.tag', 'utf8');
                let version = semver.coerce(tag);
                resolve(version);
            } catch (error) {
                // The file does not exist, use an old version
                resolve('1.0.0');
            }

            // exec('git describe --tags', (error: any, stdout: any, stderr: any) => {
            //     if (error) {
            //         reject(error);
            //         return;
            //     }

            //     let value = semver.coerce(stdout);
            //     resolve(value);
            // });
        });
    }

    private latestVersion() {
        return new Promise<string>((resolve, reject) => {
            exec('git fetch --all', (error: any, stdout: any, stderr: any) => {
                if (error) {
                    reject(error);
                    return;
                }

                exec('git describe --tags $(git rev-list --tags --max-count=1)', (error: any, stdout: any, stderr: any) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    let value = stdout;
                    resolve(value);
                })
            });
        });
    }
}