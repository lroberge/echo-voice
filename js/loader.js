import * as main from "./main.js";

const { ipcRenderer } = require('electron');

window.onload = ()=>{
	console.log("window.onload called");
	// 1 - do preload here - load fonts, images, additional sounds, etc...
	
	console.log("remote: " + ipcRenderer);

	document.querySelector("#chromeClose").addEventListener("click", function (e) {
		ipcRenderer.send('request-mainprocess-quit');
	}); 

	// 2 - start up app
	main.init();
}