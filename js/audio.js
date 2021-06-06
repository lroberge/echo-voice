import Jungle from './jungle.js';

// 1 - our WebAudio context, **we will export and make this public at the bottom of the file**
let audioCtx;

// **These are "private" properties - these will NOT be visible outside of this module (i.e. file)**
// 2 - WebAudio nodes that are part of our WebAudio audio routing graph
let element, monitorElement, sourceNode, analyserNode, gainNode, delayNode, jungleNode, destNode, monitorNode, monitorDestNode, masterNode;

// 3 - here we are faking an enumeration
// hey, i did this in my project 1! albeit not with object.freeze
const DEFAULTS = Object.freeze({
    gain: .5,
    monitorGain: .1,
    numSamples: 256
});

// create a new array of 8-bit integers (0-255)
// this is a typed array to hold the audio frequency data
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

                    // 7 - create a gain (volume) node
                    gainNode = audioCtx.createGain();
                    gainNode.gain.value = DEFAULTS.gain;

                    // 8 - connect the nodes - we now have an audio graph
                    sourceNode.connect(gainNode);
                    gainNode.connect(jungleNode.input);
                    jungleNode.output.connect(delayNode);
                    delayNode.connect(masterNode);
                    jungleNode.output.connect(masterNode);

                    masterNode.connect(analyserNode);
                    masterNode.connect(monitorNode);
                    analyserNode.connect(destNode);

                    window.gainNode = gainNode;
                    window.pitchShifterNode = jungleNode;

                    element.srcObject = destNode.stream;
                    element.play();

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

function loadSoundFile(sinkId) {
    console.log(sinkId);
    element.setSinkId(sinkId).then(() => {
        console.log(element.sinkId);
    });
}

function setVolume(value) {
    if (!gainNode) return;
    value = Number(value); // make sure that it's a Number rather than a String
    gainNode.gain.value = value;
}

export { audioCtx, setupWebaudio, loadSoundFile, setVolume, toggleFilter, analyserNode };