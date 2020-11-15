'use strict';
import * as BABYLON from 'babylonjs';

export default class {
  constructor(scene) {
    this.scene = scene;
    this.checkerBoard = 'iVBORw0KGgoAAAANSUhEUgAAAQEAAAEBCAIAAAD3joeqAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAALnSURBVHhe7dZBEYQwFAVBWBtogAv+IhIEsZd4yGG6L/lPwFRl31jqPM/neeZghd98oUoD1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjTAHUaoE4D1GmAOg1QpwHqNECdBqjb7/ueJyscxzHGmIMV9u/75skK7/te1zUHK/gLUacB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA9RpgDoNUKcB6jRAnQao0wB1GqBOA7Rt2x+drw1hSNi5LQAAAABJRU5ErkJggg==';
    this.xmark = 'data:image/png;base64,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';
    this.buildObjectMeshes = new Array();
    this.baseMaterial;
    this.highlightMaterial;
    this.cancelledMaterial;
    this.cancelledHighlightMaterial;
    this.showCancelObjects = false;
    this.objectCallback;
    this.renderFailedCallback;
    this.labelCallback;
    this.registerClipIgnore;
    this.getMaxHeight;
    this.alphaLevel = 0.5;
    this.rebuildMaterials();
  }

  setBuildMaterial(name, color, alpha) {
    if (!alpha) {
      alpha = this.alphaLevel;
    }

    let material = new BABYLON.StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0);
    material.alpha = alpha;
    material.needAlphaTesting = () => true;
    material.separateCullingPass = true;
    material.backFaceCulling = true;
    return material;
  }
  rebuildMaterials() {
    this.baseMaterial = this.setBuildMaterial('BuildObjectBaseMaterial', new BABYLON.Color3(0.1, 0.5, 0.1));
    this.highlightMaterial = this.setBuildMaterial('BuildObjectHighlightMateria', new BABYLON.Color3(0.5, 0.5, 0.5));
    this.cancelledMaterial = this.setBuildMaterial('BuildObjectHighlightMateria', new BABYLON.Color3(1, 0, 0));
    this.cancelledHighlightMaterial = this.setBuildMaterial('BuildObjectHighlightMateria', new BABYLON.Color3(1, 1, 0), 0.25);
    let material = new BABYLON.Texture.CreateFromBase64String(this.xmark, 'checkerboard', this.scene);
    this.cancelledMaterial.diffuseTexture = material;
    this.cancelledHighlightMaterial.diffuseTexture = material;
  }
  loadObjectBoundaries(boundaryObjects) {
    this.rebuildMaterials();
    if (this.buildObjectMeshes.length > 0) {
      for (let i = 0; i < this.buildObjectMeshes.length; i++) {
        this.buildObjectMeshes[i].dispose();
      }
      this.buildObjectMeshes = new Array();
    }

    if (!boundaryObjects) {
      return;
    }

    for (let cancelObjectIdx = 0; cancelObjectIdx < boundaryObjects.length; cancelObjectIdx++) {
      let cancelObject = boundaryObjects[cancelObjectIdx];

      let buildObject = BABYLON.MeshBuilder.CreateTiledBox(
        'OBJECTMESH:' + cancelObject.name,
        {
          pattern: BABYLON.Mesh.CAP_ALL,
          alignVertical: BABYLON.Mesh.TOP,
          alignHorizontal: BABYLON.Mesh.LEFT,
          tileHeight: 4,
          tileWidth: 4,
          width: Math.abs(cancelObject.x[1] - cancelObject.x[0]),
          height: this.getMaxHeight() + 10,
          depth: Math.abs(cancelObject.y[1] - cancelObject.y[0]),
          sideOrientation: BABYLON.Mesh.FRONTSIDE,
        },
        this.scene
      );

      buildObject.position.x = (cancelObject.x[1] + cancelObject.x[0]) / 2;
      buildObject.position.y = this.getMaxHeight() / 2 - 4;
      buildObject.position.z = (cancelObject.y[1] + cancelObject.y[0]) / 2;
      buildObject.alphaIndex = 5000000;
      cancelObject.index = cancelObjectIdx;
      buildObject.metadata = cancelObject;
      buildObject.enablePointerMoveEvents = true;
      this.setObjectTexture(buildObject);
      buildObject.setEnabled(this.showCancelObjects);
      this.registerClipIgnore(buildObject);
      this.buildObjectMeshes.push(buildObject);
    }
  }
  showObjectSelection(visible) {
    this.showCancelObjects = visible;
    this.buildObjectMeshes.forEach((mesh) => mesh.setEnabled(visible));
  }
  setObjectTexture(mesh) {
    if (mesh.metadata.cancelled) {
      mesh.material = this.cancelledMaterial;
    } else {
      mesh.material = this.baseMaterial;
    }
  }
  handleClick(pickInfo) {
    if (pickInfo.hit && pickInfo.pickedMesh && pickInfo.pickedMesh.name.includes('OBJECTMESH') && this.objectCallback) {
      this.objectCallback(pickInfo.pickedMesh.metadata);
    }
  }
  handlePointerMove(pickInfo) {
    this.buildObjectMeshes.forEach((mesh) => this.setObjectTexture(mesh));
    if (pickInfo.hit && pickInfo.pickedMesh && pickInfo.pickedMesh.name.includes('OBJECTMESH')) {
      pickInfo.pickedMesh.material = pickInfo.pickedMesh.metadata.cancelled ? this.cancelledHighlightMaterial : this.highlightMaterial;
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
