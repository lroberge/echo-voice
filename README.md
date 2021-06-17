# echo-voice
A voice changer for Warforged characters in D&D, built using Electron.  
(My specific interpretation of Warforged voices, obviously.)

## Features
- Global hotkey to toggle the voice changer on/off
- Visualizer of current output - also indicating when voice changer is enabled
- Output to any connected audio output
- Monitor the output audio at a lower volume through your default audio output
- Makes you sound like a cool robot

## Limitations
- Cannot currently change input device (uses default)
- Cannot currently change monitor output device (uses default)  

## Methodology
It's literally just a comb filter on top of a pitch shift.  
The delay on the comb filter ("roboticness"), as well as the octave of the pitch shift, can be altered to help produce varied voices among multiple Warforged.