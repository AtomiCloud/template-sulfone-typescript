#!/usr/bin/env bash

apt update -y
apt install software-properties-common -y
apt-add-repository "deb [trusted=yes] https://apt.fury.io/atomicloud/ /" -y
apt install cyanprint -y
