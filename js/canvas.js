/*
	The purpose of this file is to take in the analyser node and a <canvas> element: 
	  - the module will create a drawing context that points at the <canvas> 
	  - it will store the reference to the analyser node
	  - in draw(), it will loop through the data in the analyser node
	  - and then draw something representative on the canvas
	  - maybe a better name for this file/module would be *visualizer.js* ?
*/

import * as utils from './utils.js';

let bgOn = false;

let ctx,canvasWidth,canvasHeight,gradient,graph,audioData;


function setupCanvas(canvasElement,graphRef){
	// create drawing context
	ctx = canvasElement.getContext("2d");
	canvasWidth = canvasElement.width;
	canvasHeight = canvasElement.height;
	// create a gradient that runs top to bottom
	gradient = utils.getLinearGradient(ctx,0,0,0,canvasHeight,[{percent:0,color:"#22c38b"},{percent:1,color:"#2efd2d"}]);
	// keep a reference to the analyser node
	graph = graphRef;
	// this is the array where the analyser data will be stored
	audioData = new Uint8Array(graph.analyserNode.fftSize/2);
}

function toggleBg(bool) {
    if(bool) {
        gradient = utils.getLinearGradient(ctx,0,0,0,canvasHeight,[{percent:0,color:"#0292fc"},{percent:1,color:"#35356a"}]);
    } else {
        gradient = utils.getLinearGradient(ctx,0,0,0,canvasHeight,[{percent:0,color:"#22c38b"},{percent:1,color:"#2efd2d"}]);
    }

    console.log("canvas: " + bool);

    ctx.save();
    ctx.fillStyle = "black";
    ctx.globalAlpha = 1;
    ctx.fillRect(0,0,canvasWidth,canvasHeight);
    ctx.restore();
}

function draw(){
    // populate the audioData array with the frequency data from the analyserNode
	graph.analyserNode.getByteFrequencyData(audioData);
	
	// draw background
	ctx.save();
    ctx.fillStyle = "black";
    ctx.globalAlpha = .1;
    ctx.fillRect(0,0,canvasWidth,canvasHeight);
    ctx.restore();

	// draw gradient
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.globalAlpha = .3;
    ctx.fillRect(0,0,canvasWidth,canvasHeight);
    ctx.restore();

	// draw bars
    let barSpacing = 4;
    let margin = 5;
    let screenWidthForBars = canvasWidth - (audioData.length * barSpacing) - margin * 2;
    let barWidth = screenWidthForBars / audioData.length;
    let barHeight = 200;
    let topSpacing = 100;

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.50)';
    ctx.strokeStyle = 'rgba(0,0,0,0.50)';
    // loop through the data and draw
    for(let i=0; i<audioData.length; i++) {
        ctx.fillRect(margin + i * (barWidth + barSpacing),topSpacing + 256-audioData[i],barWidth,barHeight);
        ctx.strokeRect(margin + i * (barWidth + barSpacing),topSpacing + 256-audioData[i],barWidth,barHeight);
    }
}

export {setupCanvas,draw,toggleBg};