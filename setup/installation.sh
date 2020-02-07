#!/bin/bash

# Copy this file to your Raspberry PI and run it to install the repo, or call this script via:
# bash <(curl -s https://github.com/troovers/table-tennis-scoreboard-client/raw/master/setup/installation/installation.sh)

if (( $EUID == 0 )); then
    echo -e "\033[33mYou should not run this with sudo!\033[0m"
    exit
fi

echo 'Going to initialize the RPI for Scoreboard usage'
echo 'Navigating to ~/'
cd ~

function add_locales() {
    sudo sed -i "s/# nl_NL.UTF-8/nl_NL.UTF-8/g" /etc/locale.gen
    sudo locale-gen
    sudo update-locale en_US.UTF-8
}

function install_required_packages() {
    echo
    echo 'Installing required packages'
    echo '----------------------------'
    echo
    
    curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash - > /dev/null
    sudo apt-get install -qq -y vim git nodejs supervisor bluetooth bluez libbluetooth-dev libudev-dev > /dev/null
}

function clone_scoreboard_repo() {
    echo
    echo 'Cloning RPI Scoreboard repo'
    echo '---------------------------'
    echo 
    
    git clone https://github.com/troovers/table-tennis-scoreboard-client.git rpi-scoreboard

    if [ -d "rpi-scoreboard" ]; then
        cd rpi-scoreboard
        
        echo
        echo 'Switching to latest tag'
        tag=$(git describe --tags `git rev-list --tags --max-count=1`)
        git checkout $tag

        npm install
        echo 'Provide the default values for your production .env file'
        read -r -p 'ENV [production]: ' environment
        environment=${environment:-production}
        read -r -p 'HOST [localhost]: ' host
        host=${host:-localhost}
        read -r -p 'PORT [6001]: ' port
        port=${port:-6001}

        export ENV=$environment HOST=$host SOCKET_PORT=$port

        echo 
        
        envsubst '${ENV} ${HOST} ${SOCKET_PORT}' < .env.dist > .env
        npm run build

    else
        echo -e "\033[33mRepository is not cloned!\033[0m"
    fi
    
    cd ~/
}

function install_supervisor() {
    echo 
    echo 'Setup Supervisor'
    echo '----------------'
    echo
    
    echo 'Adding Supervisor process'
    cd /etc/supervisor/conf.d/
    
    sudo tee -a rpi-scoreboard.conf > /dev/null <<- EOF
[program:run-rpi-scoreboard]
directory=/home/pi/rpi-scoreboard
command=sudo npm start
autostart=true
autorestart=true
stdout_logfile=/var/log/rpi-scoreboard.log
stderr_logfile=/var/log/rpi-scoreboard.error.log
startretries=3
EOF
    
    echo
    sudo supervisorctl reread
}

add_locales
install_required_packages

echo

clone_scoreboard_repo
install_supervisor

# Reboot
echo 
read -r -p 'All done! Do you want to reboot now? (y/n): '

if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo reboot
fi
