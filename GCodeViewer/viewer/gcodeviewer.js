'use strict';

import gcodeProcessor from './gcodeprocessor.js';
import * as BABYLON from 'babylonjs';

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
    this.bedMesh;
    this.toolCursor;
    this.toolCursorMesh;
    this.toolCursorVisible = true;
    this.travelVisible = false;
    this.isDelta = false;
    this.debug = false;
    this.zTopClipValue;
    this.zBottomClipValue;

    this.renderQuality = Number(localStorage.getItem('renderQuality'));
    this.alphaLevel = 0.5;

    if (this.renderQuality === undefined || this.renderQuality === null) {
      this.renderQuality = 1;
    }

    this.checkerBoard = 'iVBORw0KGgoAAAANSUhEUgAAAQEAAAEBCAIAAAD3joeqAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAALnSURBVHhe7dZBEYQwFAVBWBtogAv+IhIEsZd4yGG6L/lPwFRl31jqPM/neeZghd98oUoD1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjb7/ueJyscxzHGmIMV9u/75skK7/te1zUHK/gLUacB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA7Rt2x+drw1hSNi5LQAAAABJRU5ErkJggg==';
    this.xmark = 'data:image/png;base64,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';

    this.cancelObjectMeshes = new Array();
    this.cancelMeshMaterial;
    this.cancelMeshHighlightMaterial;
    this.cancelMeshCancelledMaterial;
    this.cancelHitTimer = 0;
    this.showCancelObjects = false;

    this.objectCallback;
    this.renderFailedCallback;
    this.labelCallback;

    this.hasCacheSupport = 'caches' in window;
    if (this.hasCacheSupport) {
      console.info('Cache support enabled');
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

    // Add a camera to the scene and attach it to the canvas
    this.orbitCamera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, 2.356194, -250, new BABYLON.Vector3(117.5, 0, 117.5), this.scene);
    this.orbitCamera.invertRotation = false;
    this.flyCamera = new BABYLON.UniversalCamera('UniversalCamera', new BABYLON.Vector3(0, 0, -10), this.scene);
    this.orbitCamera.attachControl(this.canvas, false);
    this.scene.activeCamera.panningSensibility = 10;

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

    this.rebuildMaterials();
    this.buildBed();
    this.resetCamera();

    this.scene.onPointerObservable.add((pointerInfo) => {
      let pickInfo = pointerInfo.pickInfo;
      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
          {
            this.cancelHitTimer = Date.now();
          }
          break;
        case BABYLON.PointerEventTypes.POINTERUP:
          {
            if (Date.now() - this.cancelHitTimer > 1000) {
              return;
            }
            if (pickInfo.hit && pickInfo.pickedMesh && pickInfo.pickedMesh.name.includes('CANCELMESH') && this.objectCallback) {
              this.objectCallback(pickInfo.pickedMesh.metadata);
            }
          }
          break;
        case BABYLON.PointerEventTypes.POINTERMOVE: {
          this.cancelObjectMeshes.forEach((mesh) => this.setObjectTexture(mesh));
          if (pickInfo.hit && pickInfo.pickedMesh && pickInfo.pickedMesh.name.includes('CANCELMESH')) {
            pickInfo.pickedMesh.material = this.cancelMeshHighlightMaterial;
            if (this.labelCallback) {
              this.labelCallback(pickInfo.pickedMesh.metadata.name);
            }
          } else {
            if (this.labelCallback) {
              this.labelCallback('');
            }
          }
        }
      }
    });
  }

  rebuildMaterials() {
    this.cancelMeshMaterial = new BABYLON.StandardMaterial('cancelMeshMaterial', this.scene);
    this.cancelMeshMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.5, 0.1);
    this.cancelMeshMaterial.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0);
    this.cancelMeshMaterial.alpha = this.alphaLevel;
    this.cancelMeshMaterial.needAlphaTesting = () => true;
    this.cancelMeshMaterial.separateCullingPass = true;
    this.cancelMeshMaterial.backFaceCulling = true;

    this.cancelMeshHighlightMaterial = new BABYLON.StandardMaterial('cancelMeshMaterial', this.scene);
    this.cancelMeshHighlightMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    this.cancelMeshHighlightMaterial.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0);
    this.cancelMeshHighlightMaterial.alpha = this.alphaLevel;
    this.cancelMeshHighlightMaterial.needAlphaTesting = () => true;
    this.cancelMeshHighlightMaterial.separateCullingPass = true;
    this.cancelMeshHighlightMaterial.backFaceCulling = true;

    this.cancelMeshCancelledMaterial = new BABYLON.StandardMaterial('cancelMeshMaterial', this.scene);
    this.cancelMeshCancelledMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
    this.cancelMeshCancelledMaterial.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0);
    this.cancelMeshCancelledMaterial.alpha = this.alphaLevel;
    this.cancelMeshCancelledMaterial.needAlphaTesting = () => true;
    this.cancelMeshCancelledMaterial.separateCullingPass = true;
    this.cancelMeshCancelledMaterial.backFaceCulling = true;

    let material = new BABYLON.Texture.CreateFromBase64String(this.xmark, 'checkerboard', this.scene);
    this.cancelMeshCancelledMaterial.diffuseTexture = material;
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
    var bedSize = this.getBedSize();
    (this.scene.activeCamera.alpha = Math.PI / 2), (this.scene.activeCamera.beta = 2.356194);
    if (this.isDelta) {
      this.scene.activeCamera.radius = -this.getBedSize().diameter * 2;
      this.scene.activeCamera.target = new BABYLON.Vector3(0, 0, 0);
    } else {
      this.scene.activeCamera.radius = -250;
      this.scene.activeCamera.target = new BABYLON.Vector3(bedSize.x / 2, 0, bedSize.y / 2);
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

  showWorldAxis(size) {
    var scene = this.scene;
    var that = this;

    var makeTextPlane = function(text, color, size) {
      var dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', 50, scene, true);
      dynamicTexture.hasAlpha = true;
      dynamicTexture.drawText(text, 5, 40, 'bold 36px Arial', color, 'transparent', true);
      var plane = BABYLON.Mesh.CreatePlane('TextPlane', size, scene, true);
      plane.material = new BABYLON.StandardMaterial('TextPlaneMaterial', scene);
      plane.material.backFaceCulling = false;
      plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
      plane.material.diffuseTexture = dynamicTexture;
      that.registerClipIgnore(plane);
      return plane;
    };

    var axisX = BABYLON.Mesh.CreateLines('axisX', [BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)], this.scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    this.registerClipIgnore(axisX);
    var xChar = makeTextPlane('X', 'red', size / 10);
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
    var axisY = BABYLON.Mesh.CreateLines('axisY', [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)], this.scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    this.registerClipIgnore(axisY);
    var yChar = makeTextPlane('Z', 'green', size / 10);
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
    var axisZ = BABYLON.Mesh.CreateLines('axisZ', [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)], this.scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
    var zChar = makeTextPlane('Y', 'blue', size / 10);
    this.registerClipIgnore(axisZ);
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
  }
  getBedSize() {
    if (this.isDelta) {
      let bedSize = localStorage.getItem('deltaBedSize');
      if (bedSize === null) {
        bedSize = '300';
      }
      return { diameter: bedSize };
    } else {
      let bedSize = localStorage.getItem('bedSize');
      if (bedSize === null) {
        bedSize = [235, 235];
      } else {
        bedSize = bedSize.split(',');
        if (isNaN(bedSize[0])) {
          bedSize = [235, 235];
        }
      }

      return { x: bedSize[0], y: bedSize[1] };
    }
  }
  setBedSize(x, y) {
    if (this.isDelta) {
      localStorage.setItem('deltaBedSize', x);
    } else {
      let bedSize = [x, y];
      localStorage.setItem('bedSize', bedSize);
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
      progressColor = '#FFFFFFFF';
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
      var sceneEntity = this.scene.meshes[idx];
      this.scene.removeMesh(sceneEntity);
      if (typeof sceneEntity.dispose === 'function') {
        sceneEntity.dispose(false, true);
      }
    }

    this.toolCursor = undefined;
    this.bedMesh = undefined;

    this.rebuildMaterials();
    this.buildBed();
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
  updatePrintProgress(printPercent) {
    this.gcodeProcessor.updatePercentComplete(printPercent);
  }

  buildBed() {
    if (this.bedMesh !== undefined) return;

    var planeMaterial = new BABYLON.StandardMaterial('planeMaterial', this.scene);
    planeMaterial.alpha = 1;
    planeMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.25);
    planeMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    if (this.isDelta) {
      let bedSize = this.getBedSize();
      this.bedMesh = BABYLON.MeshBuilder.CreateDisc('BuildPlate', { radius: bedSize.diameter / 2 }, this.scene);
      this.bedMesh.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI / 2);
      this.bedMesh.material = planeMaterial;
      //this.bedMesh.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI / 2);
    } else {
      let bedSize = this.getBedSize();
      //build the scene static objects
      this.bedMesh = BABYLON.MeshBuilder.CreatePlane('BuildPlate', { width: bedSize.x, height: bedSize.y }, this.scene);
      this.bedMesh.material = planeMaterial;
      this.bedMesh.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI / 2);
      this.bedMesh.translate(new BABYLON.Vector3(bedSize.x / 2, 0, bedSize.y / 2), 1, BABYLON.Space.WORLD);
      //Render the corner axis
      this.showWorldAxis(50);
    }

    this.registerClipIgnore(this.bedMesh);
  }
  buildtoolCursor() {
    if (this.toolCursor !== undefined) return;
    this.toolCursor = new BABYLON.TransformNode('toolCursor');
    this.toolCursorMesh = BABYLON.MeshBuilder.CreateCylinder('toolposition', { diameterTop: 0, diameterBottom: 1 }, this.scene);
    this.toolCursorMesh.parent = this.toolCursor;
    this.toolCursorMesh.position = new BABYLON.Vector3(0, 3, 0);
    this.toolCursorMesh.rotate(BABYLON.Axis.X, Math.PI, BABYLON.Space.LOCAL);
    this.toolCursorMesh.scaling = new BABYLON.Vector3(3, 3, 3);
    this.toolCursorMesh.isVisible = this.toolCursorVisible;
    this.registerClipIgnore(this.toolCursorMesh);
  }
  setLiveTracking(enabled) {
    this.gcodeProcessor.setLiveTracking(enabled);
  }
  doFinalPass() {
    this.gcodeProcessor.doFinalPass();
  }
  updateRenderQuality(renderQuality) {
    this.renderQuality = renderQuality;
    if (localStorage) {
      localStorage.setItem('renderQuality', renderQuality);
    }
  }
  registerClipIgnore(mesh) {
    let that = this;
    mesh.onBeforeRenderObservable.add(function() {
      that.scene.clipPlane = null;
      that.scene.clipPlane2 = null;
    });
    mesh.onAfterRenderObservable.add(function() {
      that.scene.clipPlane = new BABYLON.Plane(0, 1, 0, that.zTopClipValue);
      that.scene.clipPlane2 = new BABYLON.Plane(0, -1, 0, that.zBottomClipValue);
    });
  }
  loadObjectBoundaries(boundaryObjects) {
    if (this.cancelObjectMeshes.length > 0) {
      for (let i = 0; i < this.cancelObjectMeshes.length; i++) {
        this.cancelObjectMeshes[i].dispose();
      }
      this.cancelObjectMeshes = new Array();
    }

    if (!boundaryObjects) {
      return;
    }

    for (let cancelObjectIdx = 0; cancelObjectIdx < boundaryObjects.length; cancelObjectIdx++) {
      let cancelObject = boundaryObjects[cancelObjectIdx];

      let cancelMesh = BABYLON.MeshBuilder.CreateTiledBox(
        'CANCELMESH:' + cancelObject.name,
        {
          pattern: BABYLON.Mesh.CAP_ALL,
          alignVertical: BABYLON.Mesh.TOP,
          alignHorizontal: BABYLON.Mesh.LEFT,
          tileHeight: 4,
          tileWidth: 4,
          width: Math.abs(cancelObject.x[1] - cancelObject.x[0]),
          height: this.gcodeProcessor.maxHeight + 10,
          depth: Math.abs(cancelObject.y[1] - cancelObject.y[0]),
          sideOrientation: BABYLON.Mesh.FRONTSIDE,
        },
        this.scene
      );

      cancelMesh.position.x = (cancelObject.x[1] + cancelObject.x[0]) / 2;
      cancelMesh.position.y = this.gcodeProcessor.maxHeight / 2 - 4;
      cancelMesh.position.z = (cancelObject.y[1] + cancelObject.y[0]) / 2;
      cancelMesh.alphaIndex = 5000000;
      cancelObject.index = cancelObjectIdx;
      cancelMesh.metadata = cancelObject;
      cancelMesh.enablePointerMoveEvents = true;
      this.setObjectTexture(cancelMesh);
      cancelMesh.setEnabled(this.showCancelObjects);
      this.registerClipIgnore(cancelMesh);
      this.cancelObjectMeshes.push(cancelMesh);
    }
  }
  showObjectSelection(visible) {
    this.showCancelObjects = visible;
    this.cancelObjectMeshes.forEach((mesh) => mesh.setEnabled(visible));
  }
  setObjectTexture(mesh) {
    if (mesh.metadata.cancelled) {
      mesh.material = this.cancelMeshCancelledMaterial;
    } else {
      mesh.material = this.cancelMeshMaterial;
    }
  }
}
