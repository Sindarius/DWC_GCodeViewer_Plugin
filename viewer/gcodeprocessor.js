/*eslint no-useless-escape: 0*/
"use strict";

import * as BABYLON from 'babylonjs'
import gcodeLine from './gcodeline'

export default class {
    constructor() {
        this.currentPosition = new BABYLON.Vector3(0, 0, 0);
        this.color = [];
        this.absolute = true; //Track if we are in relative or absolute mode.
        this.lines = [];
        this.extrudedLines = [];
        this.travels = [];
        this.currentColor = new BABYLON.Color4(1, 1, 1, 1);
        this.sps;
        this.layerDictionary = {};
        this.maxHeight = 0;
        this.lineCount = 0;
        this.renderMode = "";
        this.extruderCount = 5;

        //We'll look at the last 2 layer heights for now to determine layer height.
        this.previousLayerHeight = 0;
        this.currentLayerHeight = 0;



        this.extruderColors = [
            new BABYLON.Color4(0, 1, 1, 1), //c
            new BABYLON.Color4(1, 0, 1, 1), //m
            new BABYLON.Color4(1, 1, 0, 1), //y
            new BABYLON.Color4(0, 0, 0, 1), //k
            new BABYLON.Color4(1, 1, 1, 1) //w
        ];
    }

    setExtruderColors(colors) {
        if (colors === null || colors.length === 0) return;
        this.extruderColors = [];
        for (var idx = 0; idx < colors.length; idx++) {
            var color = colors[idx] ;
            if(color.length < 8) {
                color = color + "FF";
            }
            var extruderColor = BABYLON.Color4.FromHexString(color);
            this.extruderColors.push(extruderColor);
        }
    }

    getMaxHeight() {
        return this.maxHeight;
    }
    processGcodeFile(file) {
        var lines = file.split(/\r\n|\n/);

        //set initial color to extruder 0
        this.currentColor = this.extruderColors[0].clone();

        for (var lineNo = 0; lineNo < lines.length; lineNo++) {
            var line = lines[lineNo];
            line.trim();
            if (!line.startsWith(";")) {
                this.processLine(line);
            }
        }

        file = {}; //Clear out the file.
    }

    processLine(tokenString) {

        //Remove the comments in the line
        let commentIndex = tokenString.indexOf(";");
        if (commentIndex > -1) {
            tokenString = tokenString.substring(0, commentIndex - 1).trim();
        }


        let tokens = tokenString.toUpperCase().split(" ");
        if (tokens.length > 1) {
            switch (tokens[0]) {
                case "G0":
                case "G1":
                    var line = new gcodeLine();

                    line.start = this.currentPosition.clone();
                    for (let tokenIdx = 1; tokenIdx < tokens.length; tokenIdx++) {
                        let token = tokens[tokenIdx];
                        switch (token[0]) {
                            case "X":
                                this.currentPosition.x = this.absolute ?
                                    Number(token.substring(1)) :
                                    this.currentPosition.x + Number(token.substring(1));
                                break;
                            case "Y":
                                this.currentPosition.z = this.absolute ?
                                    Number(token.substring(1)) :
                                    this.currentPosition.z + Number(token.substring(1));
                                break;
                            case "Z":
                                this.currentPosition.y = this.absolute ?
                                    Number(token.substring(1)) :
                                    this.currentPosition.y + Number(token.substring(1));
                                this.maxHeight = this.currentPosition.y;
                                break;
                            case "E":
                                line.extruding = true;
                                break;
                        }
                    }
                    line.end = this.currentPosition.clone();

                    if (line.extruding && line.length() >= 0.01) {
                        line.color = this.currentColor.clone();
                        this.lines.push(line);

                        if (this.currentPosition.y > this.currentLayerHeight && this.currentPosition.y < 20) {
                            this.previousLayerHeight = this.currentLayerHeight;
                            this.currentLayerHeight = this.currentPosition.y;
                        }

                    } else {
                        line.color = new BABYLON.Color4(1, 0, 0, 1);
                        this.travels.push(line);
                    }
                    break;
                case "G28":
                    //Home
                    this.currentPosition = new BABYLON.Vector3(0, 0, 0);
                    break;
                case "G90":
                    this.absolute = true;
                    break;
                case "G91":
                    this.absolute = false;
                    break;
                case "G92":
                    //this resets positioning, typically for extruder, probably won't need
                    break;
                case "M567":
                    {

                        for (let tokenIdx = 1; tokenIdx < tokens.length; tokenIdx++) {
                            let token = tokens[tokenIdx];
                            var finalColors = [1, 1, 1];
                            switch (token[0]) {
                                case "E":
                                    this.extruderPercentage = token.substring(1).split(":");
                                    break;
                            }
                        }
                        for (let extruderIdx = 0; extruderIdx < 4; extruderIdx++) {
                            finalColors[0] -=
                                (1 - this.extruderColors[extruderIdx].r) *
                                this.extruderPercentage[extruderIdx];
                            finalColors[1] -=
                                (1 - this.extruderColors[extruderIdx].g) *
                                this.extruderPercentage[extruderIdx];
                            finalColors[2] -=
                                (1 - this.extruderColors[extruderIdx].b) *
                                this.extruderPercentage[extruderIdx];
                        }
                        this.currentColor = new BABYLON.Color4(
                            finalColors[0],
                            finalColors[1],
                            finalColors[2],
                            1
                        );
                        break;
                    }
            }
        } else {
            if (tokenString.startsWith("T")) {
                var extruder = Number(tokenString.substring(1)) % this.extruderCount; //For now map to extruders 0 - 4
                if (extruder < 0) extruder = 0; // Cover the case where someone sets a tool to a -1 value
                this.currentColor = this.extruderColors[extruder].clone();
            }
        }
    }

    createScene(scene) {
        var ver = 2;

        this.lineCount = this.lines.length; //rendered lines



        //if we are on a mobile device we'll have less memory to play with so switch to line rendering earlier
        if (this.lines.length > 400000 || (window.mobilecheck() && this.lines.length > 200000)) {
            console.log("Switching to line rendering mode.");
            ver = 1;
        }

        if (ver === 1) {
            this.renderMode = "Line Rendering";
            var lineArray = [];
            var colorArray = [];
            for (var lineIdx = 0; lineIdx < this.lines.length; lineIdx++) {
                let line = this.lines[lineIdx];
                let data = line.getPoints(scene);
                lineArray.push(data.points);
                colorArray.push(data.colors);
            }
            var lineMesh = BABYLON.MeshBuilder.CreateLineSystem(
                "lines", {
                lines: lineArray,
                colors: colorArray,
                updatable: false,
                useVertexAlpha: false
            }, scene);
            lineMesh.isVisible = true;
            var travelArray = [];
            var travelColorArray = [];
            for (var travelIdx = 0; travelIdx < this.travels.length; travelIdx++) {
                let line = this.travels[travelIdx];
                let data = line.getPoints(scene);
                travelArray.push(data.points);
                travelColorArray.push(data.colors);
            }
            var travelMesh = BABYLON.MeshBuilder.CreateLineSystem(
                "travels", {
                lines: travelArray,
                colors: travelColorArray,
                updatable: false,
                useVertexAlpha: false
            },
                scene
            );
            travelMesh.isVisible = false;
        }



        if (ver === 2) {

            var layerHeight = Math.floor((this.currentLayerHeight - this.previousLayerHeight) * 100) / 100;

            this.renderMode = "Mesh Rendering";
            var box = BABYLON.MeshBuilder.CreateBox(
                "box", { width: 1, height: layerHeight, depth: layerHeight * 1.2 },
                scene
            );

            var l = this.lines;

            var particleBuilder = function (particle, i, s) {
                l[s].renderLineV3(particle);
            };

            var sps = new BABYLON.SolidParticleSystem("sps", scene, { updatable: false });

            sps.addShape(box, this.lines.length, {
                positionFunction: particleBuilder
            });
            sps.buildMesh();
            sps.mesh.freezeWorldMatrix(); // prevents from re-computing the World Matrix each frame
            sps.mesh.freezeNormals();
        }

        this.lines = []; //get rid of the line data.
    }
}

window.mobilecheck = function () {
    var check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

