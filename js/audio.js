import Jungle from './jungle.js';
import { AudioGraph, GraphParam } from './graph.js';
import * as utils from './utils.js';

let audioCtx;

// WebAudio nodes that are part of our WebAudio audio routing graph
let element, monitorElement;

/** @type {AudioGraph} */
let graph = null;

const DEFAULTS = Object.freeze({
    gain: .5,
    monitorGain: .1,
    numSamples: 256
});

async function setupGraph() {
    return new Promise((resolve, reject) => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    
        // element to pipe audio to the main output
        element = new Audio();
        // element to pipe audio to the monitor output
        monitorElement = new Audio();
    
        if (navigator.getUserMedia) {
            navigator.getUserMedia(
                {
                    audio: true,
                    video: false
                },
                function (stream) {
                    let graph = new AudioGraph(audioCtx, stream, element, monitorElement);
                    resolve(graph);
                },
                function (err) {
                    console.log('Error initializing user media stream: ' + err);
                    reject("audio's fricked");
                }
            );
        }
        else {
            reject("audio's fucked");
        }
    });
}

async function setupWarforgedVoice() {

    return new Promise(async (resolve, reject) => {

        if (!graph) {
            graph = await setupGraph();
            console.log("created graph: " + graph);
        } else {
            graph.clearGraph();
        }

        let jungleNode = new Jungle(audioCtx);
        let jungleParam = new GraphParam("Pitch Shift", "Octave", "",
            -1, 1, 0.01, -0.25, val => { console.log(val); jungleNode.setPitchOffset(Number(val)); });
        
        let combNode = audioCtx.createDelay(100);
        let combParam = new GraphParam("Roboticness", "Delay", "ms",
            0, 50, 1, 20, val => { combNode.delayTime.value = Number(val)/1000; });

        jungleNode.output.connect(combNode);
        
        graph.registerTopLevelNodes([jungleNode.input]);
        graph.registerBottomLevelNodes([jungleNode.output, combNode]);
        graph.registerParams([jungleParam, combParam]);

        // hackaround
        graph.toggle(false);
        graph.toggle(true);

        resolve(graph);
    });
}

async function setupDeepSpeechVoice() {

    return new Promise(async (resolve, reject) => {

        if (!graph) {
            graph = await setupGraph();
            console.log("created graph: " + graph);
        } else {
            graph.clearGraph();
        }

        let jungleNode = new Jungle(audioCtx);
        let jungleParam = new GraphParam("Deep Pitch Shift", "Octave", "",
            -1, 1, 0.01, -0.25, val => { console.log(val); jungleNode.setPitchOffset(Number(val)); });
        
        graph.linkInputAndOutput();
        graph.registerTopLevelNodes([jungleNode.input]);
        graph.registerBottomLevelNodes([jungleNode.output]);
        graph.registerParams([jungleParam]);

        // hackaround
        graph.toggle(false);
        graph.toggle(true);

        resolve(graph);
    });
}

function toggleFilter(filtered) {
    graph.toggle(filtered);
}

function changeAudioSink(sinkId) {
    console.log(sinkId);
    graph.setOutputSink(sinkId);
}

function modifyParam(param, value) {
    graph.params[param].modify(graph, Number(value));
}

function setVolume(value) {
    graph.gainNode.gain.value = value;
}

function toggleMonitor(monitor) {

}

function setMonitorVolume(value) {

}

export { audioCtx, graph, setupWarforgedVoice, setupDeepSpeechVoice, changeAudioSink, modifyParam, setVolume, toggleMonitor, setMonitorVolume, toggleFilter };