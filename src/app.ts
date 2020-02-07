require('dotenv').config();

import { EchoClient } from "./client/echo.client";
import { BluetoothClient } from "./client/bluetooth.client";
import { VersionChecker } from "./version_checker";
import { System } from "./system";
import { ClientInterface } from "./client/client.interface";

export class App {
    private client: ClientInterface;
    private versionChecker = new VersionChecker();

    constructor() {
        // Check if we're connected to wifi
        System.getSSID().then((ssid) => {
            console.info('Connected to WiFi, initializing EchoClient');

            this.client = new EchoClient();

            // Check for new versions
            this.checkForUpdates().then(() => {
                this.client.initialize();
            }).catch((error) => {
                console.error(`Error checking for updates: ${error}`);
            });
        }).catch((error) => {
            // We need wifi
            console.error('Not connected to WiFi, initializing BluetoothClient');
        });
    }

    private async checkForUpdates() {
        return new Promise<string>(async (resolve, reject) => {
            let updatesAvailable = await this.versionChecker.updateAvailable();
            if (updatesAvailable) {
                console.info(`Updates available, downloading..`);

                this.client.showMessage('Update downloaden');

                try {
                    await this.versionChecker.update();
                } catch (error) {
                    console.error(`Unable to update: ${error}`);
                    resolve();
                    return
                }

                this.client.showMessage('Update geïnstalleerd, herstarten..');

                console.info(`Updated to new version`);

                // Reboot
                await System.restart();
            }

            resolve();
        });
    }
}