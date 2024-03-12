#!/bin/bash
#
##################################################################################################################
# Written to be used on 64 bits computers
# Author 	: 	Jeff Seely
# Email     :   seelyja71@gmail.com
##################################################################################################################
##################################################################################################################
#
#   Double Check The work We Do! Not Too Late To Back Out!
#
##################################################################################################################

# Problem solving commands

#Arcolinux.info And Other Instructional Content Of Erik Dubois. Please Consider Adding A Little Love The Wallet Of A True Friend To Your ArcoLinux Experience. Give What Can, Why Not...Because He's #One Helluva Good Dude!

project=$(basename `pwd`)
echo "-----------------------------------------------------------------------------"
echo "this is project https://github.com//"$project
echo "-----------------------------------------------------------------------------"
git config --global pull.rebase false
git config --global user.name "seelyja71"
git config --global user.email "seelyja71@gmail.com"
sudo git config --system core.editor nano
#git config --global credential.helper cache
#git config --global credential.helper 'cache --timeout=32000'
git config --global push.default simple

git remote set-url origin git@github.com:my-arco-plasma6/$project

echo "Everything set"

echo "################################################################"
echo "###################    T H E   E N D      ######################"
echo "################################################################"
