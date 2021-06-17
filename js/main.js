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

let audioData;

const { ipcRenderer } = require('electron');

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

      // create a byte array (values of 0-255) to hold the audio data
      audioData = new Uint8Array(audio.analyserNode.fftSize / 2);

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
          outputSelector.addEventListener("change", changeOutput);
        });
    });

    // make toggleFilter function accessible to the entire document
    window.toggleFilter = toggleFilter;
    window.hotkeyError = hotkeyError;
}

function toggleFilter() {
  console.log("filtered: " + filtered);
  canvas.toggleBg(filtered);
  audio.toggleFilter(filtered);
  filtered = !filtered;
  return filtered;
}

function hotkeyError() {
  console.log("hotkey errored");
  document.querySelector("#hotkeyError").classList.toggle("hide-transparent", false);
  document.querySelector("#hotkeyText").addEventListener("input", removeHotkeyError);
}

function removeHotkeyError() {
  document.querySelector("#hotkeyError").classList.toggle("hide-transparent", true);
  document.querySelector("#hotkeyText").removeEventListener("input", removeHotkeyError);
}

function changeOutput(e) {
  audio.changeAudioSink(e.target.value);
}

function setupUI(canvasElement) {

  let hotkeyTb = document.querySelector("#hotkeyText");
  let hotkeyButton = document.querySelector("#hotkeySetButton");

  hotkeyButton.onclick = e => {
    // THIS FUCKING SUCKS DUDE
    let accelRegex = /((Command|Cmd|Control|Ctrl|CommandOrControl|CmdOrCtrl|Alt|Option|AltGr|Shift|Super|Meta)\+){0,}((F[1-2]?[1-9])|Plus|Space|Tab|(Caps|Num|Scroll)lock|Backspace|Delete|Insert|Return|Enter|Up|Down|Left|Right|Home|End|Page(Up|Down)|Esc(ape)?|Volume(Up|Down|Mute)|Media((Next|Previous)Track|Stop|PlayPause)|PrintScreen|num([0-9]|dec|add|sub|mult|div)|[0-9]|[A-Z]){1}/;
    let match = hotkeyTb.value.match(accelRegex);
    if(match[0].length === hotkeyTb.value.length) {
      console.log("Hotkey changing to " + hotkeyTb.value);
      ipcRenderer.send('request-mainprocess-change-hotkey', hotkeyTb.value);
    } else {
      hotkeyError();
    }
  }

  // hook up volume slider & label
  let volumeSlider = document.querySelector("#volumeSlider");
  let volumeLabel = document.querySelector("#volumeLabel");

  volumeSlider.oninput = e => {
    // set the gain
    audio.setVolume(e.target.value);
    // update value of label to match the slider
    volumeLabel.innerHTML = Math.round((e.target.value * 100)) + "%";
  }
  // make the slider update the label
  volumeSlider.dispatchEvent(new Event("input"));

  // hook up monitor checkbox
  let monitorCB = document.querySelector("#monitorCB");
  monitorCB.oninput = e => {
    audio.toggleMonitor(e.target.checked);
    document.querySelector("#monitorVolumeControls").classList.toggle("hidden", !e.target.checked);
  }

  monitorCB.dispatchEvent(new Event("input"));

  // hook up monitor volume slider & label
  let monitorSlider = document.querySelector("#monitorVolumeSlider");
  let monitorLabel = document.querySelector("#monitorVolumeLabel");

  monitorSlider.oninput = e => {
    audio.setMonitorVolume(e.target.value);
    monitorLabel.innerText = Math.round((e.target.value * 200)) + "%";
  }
  // make the slider update the label
  monitorSlider.dispatchEvent(new Event("input"));

  // hook up pitch shift slider & label
  let pitchSlider = document.querySelector("#pitchSlider");
  let pitchLabel = document.querySelector("#pitchLabel");

  pitchSlider.oninput = e => {
    audio.setPitchShift(e.target.value);
    pitchLabel.innerText = e.target.value;
  }
  // make the slider update the label
  pitchSlider.dispatchEvent(new Event("input"));

  // hook up roboticness slider & label
  let combSlider = document.querySelector("#combSlider");
  let combLabel = document.querySelector("#combLabel");

  combSlider.oninput = e => {
    let ms = e.target.value / 1000
    audio.setCombDelay(ms);
    combLabel.innerText = e.target.value + " ms";
  }
  // make the slider update the label
  combSlider.dispatchEvent(new Event("input"));

} // end setupUI

function loop() {
  requestAnimationFrame(loop);
  if (!audio.analyserNode) return;

  canvas.draw();
}

export { init, toggleFilter };