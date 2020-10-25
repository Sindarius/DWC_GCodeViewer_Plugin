'use strict'

import gcodeProcessor from './gcodeprocessor.js'
import * as BABYLON from 'babylonjs'
import { Vector3 } from 'babylonjs';

export default class {

    constructor(canvas) {
        this.fileData;
        this.gcodeProcessor = new gcodeProcessor();
        this.maxHeight = 0;
        this.sceneBackgroundColor = "#000000";
        this.canvas = canvas;
        this.scene = {};
        this.loading = false;
        this.toolVisible = false;
        this.bedMesh;
        this.toolCursor;
        this.toolCursorMesh;
        this.toolCursorVisible = true;
        this.travelVisible = false;
        this.isDelta = false;
    }
    getMaxHeight() {
        return this.maxHeight;
    }
    setCameraType(arcRotate) {
        if (arcRotate) {
            this.scene.activeCamera = this.orbitCamera;
        } else {
            this.scene.activeCamera = this.flyCamera;
        }
    }

    setZClipPlane(value) {
        this.scene.clipPlane = new BABYLON.Plane(0, 1, 0, -value);
    }
    init() {
        this.engine = new BABYLON.Engine(this.canvas, true, { doNotHandleContextLost: true });
        this.engine.enableOfflineSupport = false;
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.debugLayer.show();
        this.scene.clearColor = BABYLON.Color3.FromHexString(this.getBackgroundColor());

        // Add a camera to the scene and attach it to the canvas
        this.orbitCamera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, 2.356194, -250, new BABYLON.Vector3(117.5, 0, 117.5), this.scene);
        this.orbitCamera.invertRotation = false;
        this.flyCamera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0, 0, -10), this.scene);
        this.orbitCamera.attachControl(this.canvas, false);
        this.scene.activeCamera.panningSensibility = 10;

        // Add lights to the scene
        //var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this.scene);
        var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), this.scene);
        light2.diffuse = new BABYLON.Color3(1, 1, 1);
        light2.specular = new BABYLON.Color3(1, 1, 1);
        var that = this;
        this.engine.runRenderLoop(function () {
            that.scene.render();

            //Update light 2 position
            light2.position = that.scene.cameras[0].position;
        });

        this.buildBed();
        this.resetCamera();
    }

    resize() {
        this.engine.resize();
    }

    refreshUI() {
        setTimeout(function () { }, 0);
    }

    resetCamera() {

        var bedSize = this.getBedSize();
        this.scene.activeCamera.alpha = Math.PI / 2,
            this.scene.activeCamera.beta = 2.356194
        if (this.isDelta) {
            this.scene.activeCamera.radius = -this.getBedSize().diameter * 2;
            this.scene.activeCamera.target = new BABYLON.Vector3(0, 0, 0);
        }
        else {
            this.scene.activeCamera.radius = -250
            this.scene.activeCamera.target = new BABYLON.Vector3(bedSize.x / 2, 0, bedSize.y / 2);
        }
    }

    processFile(fileContents) {
        this.clearScene();
        this.refreshUI();
        this.fileData = fileContents;
        this.gcodeProcessor.setExtruderColors(this.getExtruderColors());
        this.gcodeProcessor.scene = this.scene;
        this.gcodeProcessor.processGcodeFile(fileContents);
        this.gcodeProcessor.createScene(this.scene);
        this.maxHeight = this.gcodeProcessor.getMaxHeight();
        this.toggleTravels(this.travelVisible);
        this.setCursorVisiblity(this.toolCursorVisible);
    }

    toggleTravels(visible) {
        var mesh = this.scene.getMeshByName("travels");
        if (mesh !== undefined) {
            try {
                mesh.isVisible = visible;
                this.travelVisible = visible;
            }
            catch {
                console.log("Travel Mesh Error");
            }

        }
    }

    showWorldAxis(size) {
        var scene = this.scene;
        var makeTextPlane = function (text, color, size) {
            var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
            var plane = BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
            plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
            plane.material.backFaceCulling = false;
            plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
            plane.material.diffuseTexture = dynamicTexture;
            return plane;
        };
        var axisX = BABYLON.Mesh.CreateLines("axisX", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
            new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
        ], this.scene);
        axisX.color = new BABYLON.Color3(1, 0, 0);
        var xChar = makeTextPlane("X", "red", size / 10);
        xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
        var axisY = BABYLON.Mesh.CreateLines("axisY", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
            new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
        ], this.scene);
        axisY.color = new BABYLON.Color3(0, 1, 0);
        var yChar = makeTextPlane("Z", "green", size / 10);
        yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
        var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
            new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
        ], this.scene);
        axisZ.color = new BABYLON.Color3(0, 0, 1);
        var zChar = makeTextPlane("Y", "blue", size / 10);
        zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
    }
    getBedSize() {
        if (this.isDelta) {
            let bedSize = localStorage.getItem('deltaBedSize')
            if (bedSize === null) {
                bedSize = "300"
            }
            return { diameter: bedSize };
        }
        else {
            let bedSize = localStorage.getItem('bedSize');
            if (bedSize === null) {
                bedSize = [235, 235];
            } else {
                bedSize = bedSize.split(",");
                if (isNaN(bedSize[0])) {
                    bedSize = [235, 235];
                }
            }

            return { x: bedSize[0], y: bedSize[1] };
        }
    }
    setBedSize(x, y) {
        if (this.isDelta) {
            localStorage.setItem("deltaBedSize", x);
        }
        else {
            let bedSize = [x, y];
            localStorage.setItem("bedSize", bedSize);
        }
    }
    getExtruderColors() {
        let colors = localStorage.getItem('extruderColors');
        if (colors === null) {
            colors = ["#00FFFF", "#FF00FF", "#FFFF00", "#000000", "#FFFFFF"];
            this.saveExtruderColors(colors);
        } else {
            colors = colors.split(',');
        }
        return colors;
    }
    saveExtruderColors(colors) {
        localStorage.setItem('extruderColors', colors);
    }
    resetExtruderColors() {
        localStorage.removeItem("extruderColors");
        this.getExtruderColors();
    }

    getBackgroundColor() {
        let color = localStorage.getItem('sceneBackgroundColor');
        if (color === null) {
            color = "#000000";
        }
        return color;
    }
    setBackgroundColor(color) {
        if (this.scene !== null && this.scene !== undefined) {
            if (color.length > 7) {
                color = color.substring(0, 7);
            }
            this.scene.clearColor = BABYLON.Color3.FromHexString(color);
        }
        localStorage.setItem("sceneBackgroundColor", color);
    }
    clearScene() {
        this.scene.unregisterBeforeRender(this.gcodeProcessor.beforeRenderFunc);
        for (let idx = this.scene.meshes.length - 1; idx >= 0; idx--) {
            var sceneEntity = this.scene.meshes[idx];
            this.scene.removeMesh(sceneEntity);
            if (typeof sceneEntity.dispose === 'function') {
                sceneEntity.dispose();
            }
        }
        this.toolCursor = undefined;
        this.bedMesh = undefined;
        this.buildBed();
    }
    reload() {
        return new Promise(resolve => {
            this.clearScene();
            this.processFile(this.fileData);
            resolve();
        });
    }
    getLineCount() {
        return this.gcodeProcessor.lineCount;
    }
    getRenderMode() {
        return this.gcodeProcessor.renderMode;
    }
    setCursorVisiblity(visible) {
        if (this.scene === undefined) return;
        if (this.toolCursor === undefined) {
            this.buildtoolCursor();
        }
        this.toolCursorMesh.isVisible = visible;
        this.toolCursorVisible = visible;
    }
    updateToolPosition(position) {
        let x = 0;
        let y = 0;
        let z = 0;
        this.buildtoolCursor();
        for (var index = 0; index < position.length; index++) {
            switch (position[index].axes) {
                case "X": {
                    x = position[index].position;
                } break;
                case "Y": {
                    y = position[index].position;
                } break;
                case "Z": {
                    z = position[index].position;
                } break;
            }

            this.toolCursor.setAbsolutePosition(new BABYLON.Vector3(x, z, y));
        }
    }
    updatePrintProgress(printPercent) {
        this.gcodeProcessor.updatePercentComplete(printPercent);
    }

    buildBed() {
        if (this.bedMesh !== undefined) return;

        var planeMaterial = new BABYLON.StandardMaterial(this.scene);
        planeMaterial.alpha = 1;
        planeMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.25);

        if (this.isDelta) {
            let bedSize = this.getBedSize();
            this.bedMesh = BABYLON.MeshBuilder.CreateDisc("BuildPlate", { radius: bedSize.diameter / 2 }, this.scene)
            this.bedMesh.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI / 2);
            this.bedMesh.material = planeMaterial;
            //this.bedMesh.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI / 2);
        }
        else {
            let bedSize = this.getBedSize();
            //build the scene static objects
            this.bedMesh = BABYLON.MeshBuilder.CreatePlane("BuildPlate", { width: bedSize.x, height: bedSize.y }, this.scene);
            this.bedMesh.material = planeMaterial;
            this.bedMesh.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI / 2);
            this.bedMesh.translate(new BABYLON.Vector3(bedSize.x / 2, 0, bedSize.y / 2), 1, BABYLON.Space.WORLD);
            //Render the corner axis
            this.showWorldAxis(50);
        }
    }
    buildtoolCursor() {
        if (this.toolCursor !== undefined) return;
        this.toolCursor = new BABYLON.TransformNode("toolCursor");
        this.toolCursorMesh = BABYLON.MeshBuilder.CreateCylinder("toolposition", { diameterTop: 0, diameterBottom: 1 }, this.scene);
        this.toolCursorMesh.parent = this.toolCursor;
        this.toolCursorMesh.position = new Vector3(0, 3, 0);
        this.toolCursorMesh.rotate(BABYLON.Axis.X, Math.PI, BABYLON.Space.LOCAL);
        this.toolCursorMesh.scaling = new BABYLON.Vector3(3, 3, 3);
        this.toolCursorMesh.isVisible = this.toolCursorVisible;
    }
    setLiveTracking(enabled) {
        this.gcodeProcessor.setLiveTracking(enabled);
    }
    doFinalPass() {
        this.gcodeProcessor.doFinalPass();
    }


}


