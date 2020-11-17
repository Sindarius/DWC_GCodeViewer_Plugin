# DWC GCodeViewer Plugin

This is the initial version of my gcode viewer moved to a DWC Plugin.

This project is based off my original work on a viewer I used to maintain as a seperate branch of the DWC https://github.com/Sindarius/DuetWebControl/tree/3DViewer
Duet has implemented a new plugin framework in the DWC 3.2 code base so I have moved my viewer over to the plugin system.

## New Features 
1) Render Quality Option Levels
2) Progress tracking
3) Live Z tracking
4) Tool position display
5) Object Cancel/Resume

On top of these new features I have kept the extruder color mixing which was one of the original goals of this plugin.

High Detail Rendering Mode
![Image](https://github.com/Sindarius/DWC_GCodeViewer_Plugin/blob/media/HighDetail.png?raw=true)

Clipping
![Image](https://github.com/Sindarius/DWC_GCodeViewer_Plugin/blob/media/Clipping.png?raw=true)

Wire Rendeirng
![Image](https://github.com/Sindarius/DWC_GCodeViewer_Plugin/blob/media/Wire.png?raw=true)

Cancel Object Functionality
![Image](https://github.com/Sindarius/DWC_GCodeViewer_Plugin/blob/media/CancelObject.png?raw=true)
