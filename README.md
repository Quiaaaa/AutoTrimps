# Trimps Graphs - Quia Fork
This is a rewrite of Graphs, based on Zek's AutoTrimps Graphs

As of 2023-08, both the August Fork and Zek Fork of AT use these graphs. If you are using one of them, you don't need anything here. If you just want graphs without AT, this is the place to be.

## Graphs Script Installation
### Browser
Step 1:  
Install TamperMonkey:  
https://www.tampermonkey.net/

Step 2:  
Click this link: https://github.com/Quiaaaa/AutoTrimps/raw/gh-pages/GraphsOnly.user.js
If clicking the link does not work, copy the contents of user.js into a new script inside tampermonkey.  
If you are unsure how to do that, copy this:  
```
var script = document.createElement('script');
script.id = 'Quia-Graphs';
script.src = 'https://Quiaaaa.github.io/AutoTrimps/GraphsOnly.js';
script.setAttribute('crossorigin', "anonymous");
document.head.appendChild(script);
```  
Press F12 inside the game, this opens the console, and paste the text into it and hit enter, this will load the script. You will have to do this everytime you refresh the game though so I recommend getting tampermonkey to do it for you!


### Steam
Step 1:  
Go to this link to open the mods.js file on Github: <a href="https://github.com/Quiaaaa/AutoTrimps/blob/gh-pages/mods.js">mods.js</a>  
Then, right click the Raw button, hit Save link as, and save the mods.js file somewhere to your computer where you can find it, like desktop.  
![Download mods.js](https://i.imgur.com/opuO6yd.png)  

Step 2:  
In your Steam Library (where you see all your games in the Steam app), right click on Trimps, go to Manage, then Browse local files.  
A folder where Trimps is installed inside Steam should open.  
![Go to Trimps directory](https://imgur.com/cr35LK2.png)

Inside this folder, navigate to the mods folder (you should be in Steam\steamapps\common\Trimps\mods), and place the mods.js file there, like so:  
![Insert mods.js](https://imgur.com/muW6cUh.png)

Advanced users: If you have other mods installed then just copy the text in Graphs's mods.js and place it somewhere in your existing mods.js file.

Step 3:  
Restart the game, or if the game is already running, hit F5 to refresh.
