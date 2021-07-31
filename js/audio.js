import Jungle from './jungle.js';
import * as utils from './utils.js';

let audioCtx;

// WebAudio nodes that are part of our WebAudio audio routing graph
let element, monitorElement, sourceNode, analyserNode, gainNode, jungleNode, jungleGainNode, destNode, monitorNode, monitorDestNode, masterNode;

const graphTemplate = {
    sourceNode: null,      // The MediaStreamSource node providing the audio stream
    destNode: null,        // The MediaStreamDestination node that the final audio will go to
    monitorNode: null,     // The Gain node that will adjust the audio's volume for the monitor
    monitorDestNode: null, // The MediaStreamDestination node that the final audio (with monitor volume) will go to
    analyserNode: null,    // The Analyser node that provides visualizer data
    gainNode: null,        // The Gain node that will adjust the INITIAL audio volume
    masterNode: null,      // The Gain node that will collect the final audio together
    topLevelConnections: [], // An array of strings pointing to nodes on the graph that need to be connected to gainNode when toggling on
    params: []
};

let graph /*= graphTemplate*/;

const DEFAULTS = Object.freeze({
    gain: .5,
    monitorGain: .1,
    numSamples: 256
});

async function setupWarforgedVoice() {

    return new Promise((resolve, reject) => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();

        if (!element) {
            // element to pipe audio to the main output
            element = new Audio();
        }
        if (!monitorElement) {
            // element to pipe audio to the monitor output
            monitorElement = new Audio();
        }

        // get audio stream
        if (navigator.getUserMedia) {
            navigator.getUserMedia(
                {
                    audio: true,
                    video: false
                },
                function (stream) {
                    graph = graphTemplate;

                    // connect audio stream source (microphone)
                    graph.sourceNode = audioCtx.createMediaStreamSource(stream);
                    // create destination node for output audio
                    graph.destNode = audioCtx.createMediaStreamDestination();
                    // create destination node for monitor audio
                    graph.monitorDestNode = audioCtx.createMediaStreamDestination();

                    // create
                    graph.jungleNode = new Jungle(audioCtx);
                    graph.jungleNode.setPitchOffset(-0.25);

                    graph.params.push({
                        name: "Pitch Shift",
                        unitlabel: "Octave",
                        unit: "",
                        modify: function (graph, value) {
                            graph.jungleNode.setPitchOffset(value);
                        },
                        min: -1,
                        max: 1,
                        step: 0.01,
                        default: -0.25
                    });

                    graph.topLevelConnections.push("jungleNode.input");

                    // create delay node for comb filter
                    graph.delayNode = audioCtx.createDelay(100);
                    // comb filter control
                    graph.delayNode.delayTime.value = 0.02;

                    graph.params.push({
                        name: "Roboticness",
                        unitlabel: "Delay",
                        unit: "ms",
                        modify: function (graph, value) {
                            let ms = value / 1000;
                            graph.delayNode.delayTime.value = ms;
                        },
                        min: 0,
                        max: 50,
                        step: 1,
                        default: 20
                    });

                    // master node to pipe all audio into
                    graph.masterNode = audioCtx.createGain();

                    // create gain node to route monitor audio
                    graph.monitorNode = audioCtx.createGain();
                    graph.monitorNode.gain.value = DEFAULTS.monitorGain;

                    // create analyser node for visualization
                    graph.analyserNode = audioCtx.createAnalyser();

                    /*
                    // 6
                    We will request DEFAULTS.numSamples number of samples spaced equally 
                    across the sound spectrum.
                
                    If DEFAULTS.numSamples (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz, 
                    the third is 344Hz, and so on. Each bin contains a number between 0-255 representing 
                    the amplitude of that frequency.
                    */

                    graph.analyserNode.fftSize = DEFAULTS.numSamples;

                    // create input gain (volume) node
                    graph.gainNode = audioCtx.createGain();
                    graph.gainNode.gain.value = DEFAULTS.gain;

                    // connect the nodes
                    // connect source directly to input volume control
                    graph.sourceNode.connect(graph.gainNode);
                    // connect volume-adjusted audio to pitch shift node
                    graph.gainNode.connect(graph.jungleNode.input);
                    // connect pitch-shifted audio to both delay node and master output node
                    // - this is the comb filter
                    graph.jungleNode.output.connect(graph.delayNode);
                    graph.jungleNode.output.connect(graph.masterNode);
                    // connect delay node to master output node
                    graph.delayNode.connect(graph.masterNode);

                    // connect master to analyser and monitor nodes
                    graph.masterNode.connect(graph.analyserNode);
                    graph.masterNode.connect(graph.monitorNode);

                    // connect analyser node to destination
                    graph.analyserNode.connect(graph.destNode);

                    // connect monitor (gain) node to monitor desitnation
                    graph.monitorNode.connect(graph.monitorDestNode);

                    // link main output element to main output stream
                    element.srcObject = graph.destNode.stream;
                    element.play();

                    monitorElement.srcObject = graph.monitorDestNode.stream;
                    monitorElement.play();

                    console.log(graph);

                    resolve(element.sinkId);
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

async function setupDeepSpeechVoice(sinkId) {

    return new Promise((resolve, reject) => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();

        // element to pipe audio to the main output
        element = new Audio();
        // element to pipe audio to the monitor output
        monitorElement = new Audio();

        // get audio stream
        if (navigator.getUserMedia) {
            navigator.getUserMedia(
                {
                    audio: true,
                    video: false
                },
                function (stream) {
                    // connect audio stream source (microphone)
                    sourceNode = audioCtx.createMediaStreamSource(stream);
                    // create destination node for output audio
                    destNode = audioCtx.createMediaStreamDestination();
                    // create destination node for monitor audio
                    monitorDestNode = audioCtx.createMediaStreamDestination();

                    // create
                    jungleNode = new Jungle(audioCtx);
                    jungleNode.setPitchOffset(-0.25);

                    // master node to pipe all audio into
                    masterNode = audioCtx.createGain();

                    // create gain node to route monitor audio
                    monitorNode = audioCtx.createGain();
                    monitorNode.gain.value = DEFAULTS.monitorGain;

                    // create analyser node for visualization
                    analyserNode = audioCtx.createAnalyser();

                    jungleGainNode = audioCtx.createGain();
                    jungleGainNode.gain.value = 0.5;

                    /*
                    // 6
                    We will request DEFAULTS.numSamples number of samples spaced equally 
                    across the sound spectrum.
                
                    If DEFAULTS.numSamples (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz, 
                    the third is 344Hz, and so on. Each bin contains a number between 0-255 representing 
                    the amplitude of that frequency.
                    */

                    analyserNode.fftSize = DEFAULTS.numSamples;

                    // create input gain (volume) node
                    gainNode = audioCtx.createGain();
                    gainNode.gain.value = DEFAULTS.gain;

                    // connect the nodes
                    // connect source directly to input volume control
                    sourceNode.connect(gainNode);
                    // connect volume-adjusted audio to pitch shift node and master output node
                    gainNode.connect(masterNode);
                    gainNode.connect(jungleNode.input);
                    // connect pitch-shifted audio to master output node
                    jungleNode.output.connect(jungleGainNode);
                    jungleGainNode.connect(masterNode);


                    // connect master to analyser and monitor nodes
                    masterNode.connect(analyserNode);
                    masterNode.connect(monitorNode);

                    // connect analyser node to destination
                    analyserNode.connect(destNode);

                    // connect monitor (gain) node to monitor desitnation
                    monitorNode.connect(monitorDestNode);

                    // link main output element to main output stream
                    element.srcObject = destNode.stream;
                    element.play();

                    monitorElement.srcObject = monitorDestNode.stream;
                    monitorElement.play();

                    resolve(element.sinkId);
                },
                function (err) {
                    console.log('Error initializing user media stream: ' + err);
                    reject("audio's fucked");
                }
            );
        }
        else {
            reject("audio's fucked");
        }
    });
}

function toggleFilter(filtered) {

    if (filtered) {
        graph.gainNode.disconnect();
        graph.gainNode.connect(graph.analyserNode);
    } else {
        graph.gainNode.disconnect();
        graph.topLevelConnections.forEach(node => {
            graph.gainNode.connect(utils.deepProperty(graph, node));
        });
    }
    console.log("audio: " + filtered);
}

function changeAudioSink(sinkId) {
    console.log(sinkId);
    element.setSinkId(sinkId).then(() => {
        console.log(element.sinkId);
    });
}

function modifyParam(param, value) {
    graph.params[param].modify(graph, Number(value));
}

function setVolume(value) {
    if (!gainNode) return;
    value = Number(value); // make sure that it's a Number rather than a String
    gainNode.gain.value = value;
}

function toggleMonitor(monitor) {
    if (!masterNode || !monitorNode) return;
    if (monitor) {
        masterNode.connect(monitorNode);
        console.log("monitor node connected with " + masterNode.numberOfOutputs + " outputs");
    } else {
        masterNode.disconnect(monitorNode);
        console.log("monitor node disconnected with " + masterNode.numberOfOutputs + " outputs");
    }
}

function setMonitorVolume(value) {
    if (!monitorNode) return;
    value = Number(value);
    monitorNode.gain.value = value;
}

export { audioCtx, graph, setupWarforgedVoice, setupDeepSpeechVoice, changeAudioSink, modifyParam, setVolume, toggleMonitor, setMonitorVolume, toggleFilter };