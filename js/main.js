/*
  main.js is primarily responsible for hooking up the UI to the rest of the application 
  and setting up the main event loop
*/

// We will write the functions in this file in the traditional ES5 way
// In this instance, we feel the code is more readable if written this way
// If you want to re-write these as ES6 arrow functions, to be consistent with the other files, go ahead!

import * as utils from './utils.js';
import * as audio from './audio.js';
import * as canvas from './canvas.js';

const drawParams = {
  showGradient: true,
  showBars: true
};

let outputDevices = []

let filtered = true;

function init() {
  console.log("init called");
  console.log(`Testing utils.getRandomColor() import: ${utils.getRandomColor()}`);
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  .then(audio.setupWebaudio)
    .then((e) => {
      console.log(e);
      let canvasElement = document.querySelector("canvas"); // hookup <canvas> element
      setupUI(canvasElement);

      canvas.setupCanvas(canvasElement, audio.analyserNode);
      // start visualizer loop
      loop();

      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          devices.forEach((device) => {
            switch (device.kind) {
              case "audiooutput":
                outputDevices.push(device);
                break;
              default:
                break;
            }
          });
          console.log("devices enumerated!");
          console.log("output devices:")
          console.log(outputDevices);

          let outputSelector = document.querySelector("#outputSelect");

          outputSelector.innerHTML = "";
          outputDevices.forEach((device) => {
            let deviceOption = document.createElement("option");
            deviceOption.setAttribute("value", device.deviceId);
            deviceOption.innerText = device.label;
            outputSelector.appendChild(deviceOption);
          });
          outputSelector.addEventListener("change", outputSelected);
        });
    });
}

function toggleFilter() {
  console.log("filtered: " + filtered);
  canvas.toggleBg(filtered);
  audio.toggleFilter(filtered);
  filtered = !filtered;
  return filtered;
}

function outputSelected(e) {
  audio.loadSoundFile(e.target.value);
}

function setupUI(canvasElement) {

  // hook up volume slider & label
  let volumeSlider = document.querySelector("#volumeSlider");
  let volumeLabel = document.querySelector("#volumeLabel");

  volumeSlider.oninput = e => {
    // set the gain
    audio.setVolume(e.target.value);
    // update value of label to match the slider
    volumeLabel.innerHTML = Math.round((e.target.value / 2 * 100));
  }

  // force an input (with the value unchanged) 
  // to make the slider update the label
  volumeSlider.dispatchEvent(new Event("input"));

} // end setupUI

function loop() {
  /* NOTE: This is temporary testing code that we will delete in Part II */
  requestAnimationFrame(loop);
  if (!audio.analyserNode) return;
  // 1) create a byte array (values of 0-255) to hold the audio data
  // normally, we do this once when the program starts up, NOT every frame
  let audioData = new Uint8Array(audio.analyserNode.fftSize / 2);

  // 2) populate the array of audio data *by reference* (i.e. by its address)
  audio.analyserNode.getByteFrequencyData(audioData);

  canvas.draw(drawParams);
}

export { init, toggleFilter };