'use strict';

import * as BABYLON from 'babylonjs';
import 'babylonjs-materials';
import gcodeProcessor from './gcodeprocessor.js';
import Bed from './bed.js';
import BuildObjects from './buildobjects.js';
import Axes from './axes.js';

export default class {
  constructor(canvas) {
    this.lastLoadKey = 'lastLoadFailed';
    this.fileData;
    this.gcodeProcessor = new gcodeProcessor();
    this.maxHeight = 0;
    this.sceneBackgroundColor = '#000000';
    this.canvas = canvas;
    this.scene = {};
    this.loading = false;
    this.toolVisible = false;
    this.toolCursor;
    this.toolCursorMesh;
    this.toolCursorVisible = true;
    this.travelVisible = false;
    this.debug = false;
    this.zTopClipValue;
    this.zBottomClipValue;
    this.cancelHitTimer = 0;

    //objects
    this.bed;
    this.buildObjects;
    this.axes;

    this.renderQuality = Number(localStorage.getItem('renderQuality'));
    if (this.renderQuality === undefined || this.renderQuality === null) {
      this.renderQuality = 1;
    }

    this.hasCacheSupport = 'caches' in window;
    if (this.hasCacheSupport) {
      window.caches
        .open('gcode-viewer')
        .then(() => {
          console.info('Cache support enabled');
        })
        .catch(() => {
          //Chrome and safari hide caches when not available. Firefox exposes it regardless so we have to force a fail to see if it is supported
          this.hasCacheSupport = false;
        });
    }
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
  setZClipPlane(top, bottom) {
    this.zTopClipValue = -top;
    this.zBottomClipValue = bottom;
    if (bottom > top) {
      this.zTopClipValue = bottom + 1;
    }
    this.scene.clipPlane = new BABYLON.Plane(0, 1, 0, this.zTopClipValue);
    this.scene.clipPlane2 = new BABYLON.Plane(0, -1, 0, this.zBottomClipValue);
  }
  init() {
    this.engine = new BABYLON.Engine(this.canvas, true, { doNotHandleContextLost: true });
    this.engine.enableOfflineSupport = false;
    this.scene = new BABYLON.Scene(this.engine);
    if (this.debug) {
      this.scene.debugLayer.show();
    }
    this.scene.clearColor = BABYLON.Color3.FromHexString(this.getBackgroundColor());

    this.bed = new Bed(this.scene);
    this.bed.registerClipIgnore = (mesh) => {
      this.registerClipIgnore(mesh);
    };
    var bedCenter = this.bed.getCenter();

    // Add a camera to the scene and attach it to the canvas
    this.orbitCamera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, 2.356194, 250, new BABYLON.Vector3(bedCenter.x, -2, bedCenter.y), this.scene);
    this.orbitCamera.invertRotation = false;
    this.orbitCamera.attachControl(this.canvas, false);
    this.orbitCamera.inputs.attached.keyboard.angularSpeed = 0.005;
    this.orbitCamera.inputs.attached.keyboard.zoomingSensibility = 2;
    this.orbitCamera.inputs.attached.keyboard.panningSensibility = 2;
    this.orbitCamera.panningSensibility = 10;
    this.orbitCamera.zoomingSensibility = 10;
    this.orbitCamera.wheelDeltaPercentage = 0.02;
    this.orbitCamera.pinchDeltaPercentage = 0.02;
    //Disabled at the moment
    //this.flyCamera = new BABYLON.UniversalCamera('UniversalCamera', new BABYLON.Vector3(0, 0, -10), this.scene);

    // Add lights to the scene

    //var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this.scene);
    var light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(0, 1, -1), this.scene);
    light2.diffuse = new BABYLON.Color3(1, 1, 1);
    light2.specular = new BABYLON.Color3(1, 1, 1);
    var that = this;
    this.engine.runRenderLoop(function() {
      that.scene.render();

      //Update light 2 position
      light2.position = that.scene.cameras[0].position;
    });

    this.buildObjects = new BuildObjects(this.scene);
    this.buildObjects.getMaxHeight = () => {
      return this.gcodeProcessor.getMaxHeight();
    };
    this.buildObjects.registerClipIgnore = (mesh) => {
      this.registerClipIgnore(mesh);
    };
    this.bed.buildBed();

    this.axes = new Axes(this.scene);
    this.axes.registerClipIgnore = (mesh) => {
      this.registerClipIgnore(mesh);
    };
    this.axes.render(50);

    this.resetCamera();
  }

  resize() {
    this.engine.resize();
  }

  refreshUI() {
    setTimeout(function() {}, 0);
  }

  setFileName(path) {
    if (this.hasCacheSupport) {
      window.caches.open('gcode-viewer').then(function(cache) {
        var pathData = new Blob([path], { type: 'text/plain' });
        cache.put('gcodeFileName', new Response(pathData));
      });
    }
  }

  getFileName() {
    if (this.hasCacheSupport) {
      window.caches.open('gcode-viewer').then(function(cache) {
        cache.match('gcodeData').then(function(response) {
          response.text().then(function(text) {
            return text;
          });
        });
      });
    } else {
      return '';
    }
  }

  resetCamera() {
    var bedCenter = this.bed.getCenter();
    var bedSize = this.bed.getSize();
    (this.scene.activeCamera.alpha = Math.PI / 2), (this.scene.activeCamera.beta = 2.356194);
    if (this.bed.isDelta) {
      this.scene.activeCamera.radius = bedCenter.x;
      this.scene.activeCamera.target = new BABYLON.Vector3(bedCenter.x, -2, bedCenter.y);
      this.scene.activeCamera.position = new BABYLON.Vector3(-bedSize.x, bedSize.z, -bedSize.x);
    } else {
      this.scene.activeCamera.radius = 250;
      this.scene.activeCamera.target = new BABYLON.Vector3(bedCenter.x, -2, bedCenter.y);
      this.scene.activeCamera.position = new BABYLON.Vector3(-bedSize.x / 2, bedSize.z, -bedSize.y / 2);
    }
  }

  lastLoadFailed() {
    if (!localStorage) return false;
    return localStorage.getItem(this.lastLoadKey) === 'true';
  }
  setLoadFlag() {
    if (localStorage) {
      localStorage.setItem(this.lastLoadKey, 'true');
    }
  }

  clearLoadFlag() {
    if (localStorage) {
      localStorage.setItem(this.lastLoadKey, '');
      localStorage.removeItem(this.lastLoadKey);
    }
  }

  async processFile(fileContents) {
    this.clearScene();
    this.refreshUI();

    let that = this;
    if (this.hasCacheSupport) {
      window.caches.open('gcode-viewer').then(function(cache) {
        var gcodeData = new Blob([fileContents], { type: 'text/plain' });
        cache.put('gcodeData', new Response(gcodeData));
      });
    }

    this.fileData = fileContents;
    this.gcodeProcessor.setExtruderColors(this.getExtruderColors());
    this.gcodeProcessor.setProgressColor(this.getProgressColor());
    this.gcodeProcessor.scene = this.scene;

    if (this.lastLoadFailed()) {
      console.error('Last rendering failed dropping to SBC quality');
      this.updateRenderQuality(1);
      this.clearLoadFlag();
    }
    this.setLoadFlag();
    await this.gcodeProcessor.processGcodeFile(fileContents, this.renderQuality, function() {
      if (that.hasCacheSupport) {
        that.fileData = ''; //free resourcs sooner
      }
    });
    this.clearLoadFlag();

    this.gcodeProcessor.createScene(this.scene);
    this.maxHeight = this.gcodeProcessor.getMaxHeight();
    this.toggleTravels(this.travelVisible);
    this.setCursorVisiblity(this.toolCursorVisible);
  }

  toggleTravels(visible) {
    var mesh = this.scene.getMeshByName('travels');
    if (mesh !== undefined) {
      try {
        mesh.isVisible = visible;
        this.travelVisible = visible;
      } catch {
        //console.log('Travel Mesh Error');
      }
    }
  }

  getExtruderColors() {
    let colors = localStorage.getItem('extruderColors');
    if (colors === null) {
      colors = ['#00FFFF', '#FF00FF', '#FFFF00', '#000000', '#FFFFFF'];
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
    localStorage.removeItem('extruderColors');
    this.getExtruderColors();
  }
  getProgressColor() {
    let progressColor = localStorage.getItem('progressColor');
    if (progressColor === null) {
      progressColor = '#FFFFFF';
    }
    return progressColor;
  }
  setProgressColor(value) {
    localStorage.setItem('progressColor', value);
    this.gcodeProcessor.setProgressColor(value);
  }

  getBackgroundColor() {
    let color = localStorage.getItem('sceneBackgroundColor');
    if (color === null) {
      color = '#000000';
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
    localStorage.setItem('sceneBackgroundColor', color);
  }
  clearScene(clearFileData) {
    if (this.fileData && clearFileData) {
      this.fileData = '';
    }
    this.gcodeProcessor.unregisterEvents();

    for (let idx = this.scene.meshes.length - 1; idx >= 0; idx--) {
      let sceneEntity = this.scene.meshes[idx];
      if (sceneEntity && this.debug) {
        console.log(`Disposing ${sceneEntity.name}`);
      }
      this.scene.removeMesh(sceneEntity);
      if (sceneEntity && typeof sceneEntity.dispose === 'function') {
        sceneEntity.dispose(false, true);
      }
    }

    for (let idx = this.scene.materials.length - 1; idx >= 0; idx--) {
      let sceneEntity = this.scene.materials[idx];
      if (sceneEntity.name !== 'solidMaterial') continue;
      if (sceneEntity && this.debug) {
        console.log(`Disposing ${sceneEntity.name}`);
      }
      this.scene.removeMaterial(sceneEntity);
      if (sceneEntity && typeof sceneEntity.dispose === 'function') {
        sceneEntity.dispose(false, true);
      }
    }

    if (this.toolCursor) {
      this.toolCursor.dispose(false, true);
      this.toolCursor = undefined;
    }

    this.buildtoolCursor();
    this.bed.buildBed();
    this.axes.render();
  }
  reload() {
    return new Promise((resolve) => {
      this.clearScene();

      if (this.hasCacheSupport) {
        let that = this;
        window.caches.open('gcode-viewer').then(function(cache) {
          cache.match('gcodeData').then(function(response) {
            response.text().then(function(text) {
              that.processFile(text).then(() => {
                resolve();
              });
            });
          });
        });
      } else {
        this.processFile(this.fileData).then(() => {
          resolve();
        });
      }
    });
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
        case 'X':
          {
            x = position[index].position;
          }
          break;
        case 'Y':
          {
            y = position[index].position;
          }
          break;
        case 'Z':
          {
            z = position[index].position * (this.gcodeProcessor.spreadLines ? this.gcodeProcessor.spreadLineAmount : 1);
          }
          break;
      }

      this.toolCursor.setAbsolutePosition(new BABYLON.Vector3(x, z, y));
    }
  }
  buildtoolCursor() {
    if (this.toolCursor !== undefined) return;
    this.toolCursor = new BABYLON.TransformNode('toolCursorContainer');
    this.toolCursorMesh = BABYLON.MeshBuilder.CreateCylinder('toolCursorMesh', { diameterTop: 0, diameterBottom: 1 }, this.scene);
    this.toolCursorMesh.parent = this.toolCursor;
    this.toolCursorMesh.position = new BABYLON.Vector3(0, 3, 0);
    this.toolCursorMesh.rotate(BABYLON.Axis.X, Math.PI, BABYLON.Space.LOCAL);
    this.toolCursorMesh.scaling = new BABYLON.Vector3(3, 3, 3);
    this.toolCursorMesh.isVisible = this.toolCursorVisible;
    this.registerClipIgnore(this.toolCursorMesh);
  }
  updateRenderQuality(renderQuality) {
    this.renderQuality = renderQuality;
    if (localStorage) {
      localStorage.setItem('renderQuality', renderQuality);
    }
  }
  registerClipIgnore(mesh) {
    if (mesh === undefined || mesh === null) return;
    mesh.onBeforeRenderObservable.add(() => {
      this.scene.clipPlane = null;
      this.scene.clipPlane2 = null;
    });
    mesh.onAfterRenderObservable.add(() => {
      this.scene.clipPlane = new BABYLON.Plane(0, 1, 0, this.zTopClipValue);
      this.scene.clipPlane2 = new BABYLON.Plane(0, -1, 0, this.zBottomClipValue);
    });
  }
}
