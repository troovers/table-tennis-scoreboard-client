# Table of contents

1. [Installation](#installation)
1. [Configuration](#configuration)
1. [Running](#running)

## Installation

Install this repo on your Raspberry Pi in a few easy steps. First, make sure your Pi is ready to go. You may use the `setup-rpi.sh` script in the `setup` folder to get up and running.

### Using `setup-rpi.sh` (optional)
Plug the SD card for your Raspberry Pi into your PC. On execution, the `setup/setup-rpi.sh` script will format the disk and write a downloaded Raspbian image to your card. It will also configure a WiFi network if you wish to set it up. You can download the script and run it on your PC:

```
$ ./setup-rpi.sh
```

### Install the repo on your PI
The `setup` folder also contains the installation script for this repo and it's required dependencies. It will install the packages: `git nodejs supervisor bluetooth bluez libbluetooth-dev libudev-dev`. Then it will clone the latest version of the repo, where you will need to provide the details for your `.env` file. Finally it will configure a Supervisor process to be started when launching your Pi. The process will make sure the scoreboard will keep running at all times.

## Configuration
The scoreboard will automatically check for new versions on launch and install the latest one. Once downloaded, the scoreboard will build the newly downloaded code by running `npm run build`. When it's finished, the board will be rebooted. 

**Everytime you make adjustments to your .env file, you need to rebuild using: `npm run build`**

## Running
A Supervisor process will keep the board running at all times. However, when you want to run it to test, you can start the board manually: `npm run start`. For this command to work, you need to rebuild your code everytime you make changes. You could also run the board using `ts-node`: 

```
$ ts-node index.ts
```

### Debugging

```
DEBUG=* ts-node index.ts
```
