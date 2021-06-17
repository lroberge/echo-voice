# echo-voice
![](https://i.imgur.com/AVAp1jF.png)

A voice changer for Warforged characters in D&D, built using Electron.  
(My specific interpretation of Warforged voices, obviously.)

## Usage
**Set your voice output before trying to speak.** (If you're using Discord (or VoIP in general) I've found that [VB-CABLE](https://vb-audio.com/Cable/) is very good for piping into an audio input.)

When the app starts, the filter is enabled by default. **You can toggle the filter using the default hotkey, Alt+G**, or set your own in the interface (using Electron's [Accelerator syntax](https://www.electronjs.org/docs/api/accelerator)).

When the visualizer is green, the filter is on. When it's blue, it's off.

**If you'd also like to hear your voice, but quieter, turn Monitor on.** The sound from this always goes to your default audio output, and is half as loud as the main output. 

**Adjust the source volume only if necessary.** It can go up to ***double*** your normal volume. In theory, you shouldn't have to touch it - your voice volume should stay about the same - but I can't predict users' audio setups very well.

**The main settings to change the quality of your voice are Pitch Shift and Roboticness.**    
Pitch Shift ranges from -1 to 1 octaves - values below 0 are lower than usual, values above 0 are higher.    
Roboticness ranges from 0 to 50 ms - 0 ms causes no "echo", while 50 ms causes a *lot*.      
***I would not recommend messing with these settings while the filter is active in a voice channel!*** It's not guaranteed to hurt other people's ears, but I haven't tested it enough to say it won't. Right now, the best way to store different presets is to play around while outputting to your own speakers, then write down the Pitch Shift and Roboticness values.

## Features
- Global hotkey to toggle the voice changer on/off
- Visualizer of current output - also indicating when voice changer is enabled
- Output to any connected audio output
- Monitor the output audio at a lower volume through your default audio output
- Makes you sound like a cool robot

## Limitations
- Settings are not carried between sessions
- Small delay (<250ms) for voice output, even when toggled off
- Cannot currently change input device (uses default)
- Cannot currently change monitor output device (uses default)  

## Methodology
It's a comb filter on top of a pitch shift.  
The delay on the comb filter ("roboticness"), as well as the octave of the pitch shift, can be altered to help produce varied voices among multiple Warforged.