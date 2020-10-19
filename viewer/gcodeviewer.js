'use strict'

import gcodeProcessor from './gcodeprocessor.js'
import * as BABYLON from 'babylonjs'

export default class {

    constructor(canvas) {
        this.fileData;
        this.gcodeProcessor = new gcodeProcessor();
        this.maxHeight = 0;
        this.sceneBackgroundColor = "#000000";
        this.canvas = canvas;
        this.scene = {};
        this.loading = false;
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
        this.engine = new BABYLON.Engine(this.canvas, true); //, {doNotHandleContextLost: true})
        this.engine.enableOfflineSupport = false;
        this.scene = new BABYLON.Scene(this.engine);
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
        this.scene.activeCamera.radius = -250
        this.scene.activeCamera.target = new BABYLON.Vector3(bedSize.x / 2, 0, bedSize.y / 2);
    }

    processFile(fileContents) {
        return new Promise(resolve => {
            this.clearScene();
            this.refreshUI();
            var planeMaterial = new BABYLON.StandardMaterial(this.scene);
            planeMaterial.alpha = 0.5;
            planeMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.25);

            var bedSize = this.getBedSize();

            //build the scene static objects
            var buildPlatePlane = BABYLON.MeshBuilder.CreatePlane("BuildPlate", { width: bedSize.x, height: bedSize.y }, this.scene);
            buildPlatePlane.material = planeMaterial;
            buildPlatePlane.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI / 2);
            buildPlatePlane.translate(new BABYLON.Vector3(bedSize.x / 2, 0, bedSize.y / 2), 1, BABYLON.Space.WORLD);
            //Render the corner axis
            this.showWorldAxis(50);

            this.fileData = fileContents;
            this.gcodeProcessor.setExtruderColors(this.getExtruderColors());
            this.gcodeProcessor.processGcodeFile(fileContents);
            this.gcodeProcessor.createScene(this.scene);
            this.maxHeight = this.gcodeProcessor.getMaxHeight();
            resolve();
        });
    }


    toggleTravels() {
        var mesh = this.scene.getMeshByName("travels");
        if (mesh !== undefined) {
            mesh.isVisible = !mesh.isVisible;
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
        var bedSize = localStorage.getItem('bedSize');
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
    setBedSize(x, y) {
        var bedSize = [x, y];
        localStorage.setItem("bedSize", bedSize);
    }
    getExtruderColors() {
        var colors = localStorage.getItem('extruderColors');
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
        var color = localStorage.getItem('sceneBackgroundColor');
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
        for (var idx = this.scene.meshes.length - 1; idx >= 0; idx--) {
            var sceneEntity = this.scene.meshes[idx];
            this.scene.removeMesh(sceneEntity);
            if (typeof sceneEntity.dispose === 'function') {
                sceneEntity.dispose();
            }
        }
    }
    reload() {
        return new Promise(resolve => {
            this.clearScene();
            this.processFile(this.fileData).then(resolve);
        });
    }
    getLineCount() {
        return this.gcodeProcessor.lineCount;
    }
    getRenderMode() {
        return this.gcodeProcessor.renderMode;
    }

}


