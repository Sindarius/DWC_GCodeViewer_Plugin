import * as BABYLON from 'babylonjs';

export default class {
  constructor() {
    this.cancelObjectMeshes = new Array();
    this.cancelMeshMaterial;
    this.cancelMeshHighlightMaterial;
    this.cancelMeshCancelledMaterial;
    this.cancelHitTimer = 0;
    this.showCancelObjects = false;
  }
}
