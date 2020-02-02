#!/bin/bash

trap ctrl_c INT

function ctrl_c() {
    exit
}

echo 'We are going to install a Raspbian image to the Pi. You need to have downloaded this file already and stored it somewhere. The SD card should also be plugged into your pc.'
echo 

diskutil list

# Get the disk
read -r -p 'Disk (like: disk2): ' disk
read -r -p 'Name for the disk (like: RPI003): ' name 
read -r -p 'Path to Raspbian img (like: /Users/thomasroovers/image.img): ' raspbianPath

echo "Going to erase disk: $disk, name it: $name and write the image: $raspbianPath."
read -r -p 'Do you want to continue? (y/n) ' #-n 1

echo

if [[ $REPLY =~ ^[Yy]$ ]]
then

    # Erase the disk
    echo 'Erasing disk..'
	sudo diskutil eraseDisk FAT32 $name MBRFormat /dev/$disk

	echo "Unmounting /dev/$disk"
	sudo diskutil unmountDisk /dev/$disk

	echo 'Writing image, this takes a couple of minutes..'
	sudo dd bs=1m if=$raspbianPath of=/dev/r$disk conv=sync

	echo 'Image written!'

	read -r -p 'Want to setup WiFi? (y/n) ' #-n 1

	echo

	if [[ $REPLY =~ ^[Yy]$ ]]
	then

		read -r -p 'What is the SSID? ' ssid
		read -s -p 'What is the password? ' password

		cd /Volumes/boot

		cat <<- EOF > /Volumes/boot/wpa_supplicant.conf
		country=NL
		ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev

		network={
		    ssid="$ssid"
		    psk="$password"
		}
		EOF

		touch /Volumes/boot/ssh

		echo
		echo 'WiFi and SSH setup! We are done!'
	fi

	sudo diskutil unmountDisk /dev/$disk
fi