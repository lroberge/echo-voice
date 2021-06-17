import Jungle from './jungle.js';

let audioCtx;

// WebAudio nodes that are part of our WebAudio audio routing graph
let element, monitorElement, sourceNode, analyserNode, gainNode, delayNode, jungleNode, destNode, monitorNode, monitorDestNode, masterNode;

const DEFAULTS = Object.freeze({
    gain: .5,
    monitorGain: .1,
    numSamples: 256
});

// create a typed array to hold the audio frequency data
let audioData = new Uint8Array(DEFAULTS.numSamples / 2);

async function setupWebaudio(sinkId) {

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

                    // create delay node for comb filter
                    delayNode = audioCtx.createDelay(100);
                    // comb filter control
                    delayNode.delayTime.value = 0.02;

                    // master node to pipe all audio into
                    masterNode = audioCtx.createGain();

                    // create gain node to route monitor audio
                    monitorNode = audioCtx.createGain();
                    monitorNode.gain.value = DEFAULTS.monitorGain;

                    // create analyser node for visualization
                    analyserNode = audioCtx.createAnalyser();

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
                    // connect volume-adjusted audio to pitch shift node
                    gainNode.connect(jungleNode.input);
                    // connect pitch-shifted audio to both delay node and master output node
                    // - this is the comb filter
                    jungleNode.output.connect(delayNode);
                    jungleNode.output.connect(masterNode);
                    // connect delay node to master output node
                    delayNode.connect(masterNode);

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
        gainNode.disconnect();
        gainNode.connect(analyserNode);
    } else {
        gainNode.disconnect();
        gainNode.connect(jungleNode.input);
    }
    console.log("audio: " + filtered);
}

function changeAudioSink(sinkId) {
    console.log(sinkId);
    element.setSinkId(sinkId).then(() => {
        console.log(element.sinkId);
    });
}

function setPitchShift(octave) {
    if (!jungleNode) return;
    octave = Number(octave);
    jungleNode.setPitchOffset(octave);
}

function setCombDelay(ms) {
    if (!delayNode) return;
    ms = Number(ms);
    delayNode.delayTime.value = ms;
}

function setVolume(value) {
    if (!gainNode) return;
    value = Number(value); // make sure that it's a Number rather than a String
    gainNode.gain.value = value;
}

function toggleMonitor(monitor) {
    if(!masterNode || !monitorNode) return;
    if(monitor) {
        masterNode.connect(monitorNode);
        console.log("monitor node connected with " + masterNode.numberOfOutputs + " outputs");
    } else {
        masterNode.disconnect(monitorNode);
        console.log("monitor node disconnected with " + masterNode.numberOfOutputs + " outputs");
    }
}

function setMonitorVolume(value) {
    if(!monitorNode) return;
    value = Number(value);
    monitorNode.gain.value = value;
}

export { audioCtx, setupWebaudio, changeAudioSink, setPitchShift, setCombDelay, setVolume, toggleMonitor, setMonitorVolume, toggleFilter, analyserNode };