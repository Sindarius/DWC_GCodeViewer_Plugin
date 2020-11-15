'use strict';

import * as BABYLON from 'babylonjs';

export const RenderBedMode = {
  bed: 0,
  box: 1,
};

export default class {
  constructor(scene) {
    this.buildVolume = {
      x: {
        min: 0,
        max: 100,
      },
      y: {
        min: 0,
        max: 100,
      },
      z: {
        min: 0,
        max: 100,
      },
    };

    var buildVol = localStorage.getItem('buildVolume');
    if (buildVol !== null) {
      this.buildVolume = JSON.parse(buildVol);
    }

    this.rendrMode = Number.parseInt(localStorage.getItem('renderBedMode')); //0 plane 1 cube extents
    if (!this.renderMode) {
      this.renderMode = RenderBedMode.bed;
    }

    this.bedMesh;
    this.isDelta = false;
    this.scene = scene;

    this.planeMaterial = new BABYLON.StandardMaterial('planeMaterial', this.scene);
    this.planeMaterial.alpha = 1;
    this.planeMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.25);
    this.planeMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  }

  setRenderMode(renderBedMode) {
    this.renderMode = renderBedMode;
    localStorage.setItem('renderBedMode', this.renderMode);
    this.scene.removeMesh(this.bedMesh);
    this.bedMesh.dispose(true);
    this.buildBed();
  }
  buildBed() {
    if (this.bedMesh && this.bedMesh.isDisposed()) {
      this.bedMesh = null;
    }
    if (this.bedMesh) return this.bedMesh;

    switch (this.renderMode) {
      case RenderBedMode.bed:
        this.buildFlatBed();
        break;
      case RenderBedMode.box:
        this.buildBox();
        break;
    }
    return this.bedMesh;
  }
  buildFlatBed() {
    if (this.isDelta) {
      let radius = Math.abs(this.buildVol.x.max - this.buildVolume.x.min) / 2;
      this.bedMesh = BABYLON.MeshBuilder.CreateDisc('BuildPlate', { radius: radius }, this.scene);
      this.bedMesh.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI / 2);
      this.bedMesh.material = this.planeMaterial;
    } else {
      //build the scene static objects
      let width = Math.abs(this.buildVolume.x.max - this.buildVolume.x.min);
      let depth = Math.abs(this.buildVolume.y.max - this.buildVolume.y.min);
      let center = this.getCenter();

      this.bedMesh = BABYLON.MeshBuilder.CreatePlane('BuildPlate', { width: width, height: depth }, this.scene);
      this.bedMesh.material = this.planeMaterial;
      this.bedMesh.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI / 2);
      this.bedMesh.translate(new BABYLON.Vector3(center.x, 0, center.y), 1, BABYLON.Space.WORLD);
    }
  }
  getCenter() {
    return {
      x: (this.buildVolume.x.max + this.buildVolume.x.min) / 2,
      y: (this.buildVolume.y.max + this.buildVolume.y.min) / 2,
      z: (this.buildVolume.z.max + this.buildVolume.z.min) / 2,
    };
  }
  buildBox() {}
  setVisibility(visibility) {
    if (this.bedMesh) {
      this.bedMesh.setEnabled(visibility);
    }
  }
  commitBedSize() {
    localStorage.setItem('buildVolume', JSON.stringify(this.buildVolume));
    this.setRenderMode(this.renderMode);
  }
}
