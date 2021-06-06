import * as main from "./main.js";
window.onload = ()=>{
	console.log("window.onload called");
	// 1 - do preload here - load fonts, images, additional sounds, etc...
	
	// 2 - start up app
	main.init();
}

function toggleFilter() {
	return main.toggleFilter();
}

window.toggleFilter = toggleFilter;