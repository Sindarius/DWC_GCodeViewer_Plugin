<template>
   <div class="primary-container" v-resize="resize">
      <div class="controls pa-1 ma-0">
         <v-card>
            <v-btn @click="reset" block>Reset View</v-btn>
            <v-btn @click="reloadviewer" :disabled="loading" block>Reload View</v-btn>
            <v-btn @click="loadRunningJob" :disabled="!isJobRunning || loading" block>Load Current Job</v-btn>
            <v-btn @click="clearScene" v-show="debugVisible" :disabled="loading" block>Clear Scene</v-btn>
            <v-checkbox v-model="showObjectSelection" :disabled="!canCancelObject" :label="jobSelectionLabel"></v-checkbox>
            <v-checkbox v-model="showCursor" label="Show Cursor"></v-checkbox>
            <!--v-checkbox v-model="showTravelLines" label="Show Travels"></v-checkbox-->
         </v-card>
         <v-card>
            <h3>Render Quality</h3>
            <v-btn-toggle exclusive mandatory v-model="renderQuality" class="btn-toggle">
               <v-btn :value="1">SBC</v-btn>
               <v-btn :value="2">Low</v-btn>
               <v-btn :value="3">Medium</v-btn>
               <v-btn :value="4">High</v-btn>
               <v-btn :value="5">Ultra</v-btn>
               <v-btn :value="6">Max</v-btn>
            </v-btn-toggle>
            <v-checkbox v-model="forceWireMode" label="Force Line Rendering"></v-checkbox>
            <v-checkbox v-model="vertexAlpha" label="Wire Vertex Alpha"></v-checkbox>
            <v-checkbox v-model="spreadLines" label="Spread Lines"></v-checkbox>
         </v-card>
         <v-card v-for="(extruder, index) in extruderColors" :key="index">
            <h3>Tool {{ index.axes }}</h3>
            <gcodeviewer-color-picker
               :editcolor="extruder"
               @updatecolor="
                  (value) => {
                     updateColor(index, value);
                  }
               "
            >
            </gcodeviewer-color-picker>
         </v-card>
         <v-card>
            <v-btn block @click="resetExtruderColors">Reset Extruder Colors</v-btn>
         </v-card>
         <v-card>
            <v-slider min="0.1" :max="maxHeight" v-model="sliderHeight" thumb-label thumb-size="24" label="T Slider" step="0.1"></v-slider>
            <v-slider min="0.1" :max="maxHeight" v-model="sliderBottomHeight" thumb-label thumb-size="24" label="B Slider" step="0.1"></v-slider>

            <v-checkbox v-model="liveZTracking" label="Live Z Tracking"></v-checkbox>
         </v-card>
         <v-card>
            <h3>Progress Color</h3>
            <gcodeviewer-color-picker :editcolor="progressColor" @updatecolor="(value) => updateProgressColor(value)"></gcodeviewer-color-picker>
         </v-card>
         <v-card>
            <h3>Background</h3>
            <gcodeviewer-color-picker :editcolor="backgroundColor" @updatecolor="(value) => updateBackground(value)"></gcodeviewer-color-picker>
         </v-card>
      </div>
      <div class="viewer-box">
         <canvas ref="viewerCanvas" class="babylon-canvas" />
      </div>

      <v-dialog v-model="objectDialogData.showDialog" max-width="300">
         <v-card>
            <v-card-title class="headline">{{ objectDialogData.info.cancelled ? 'Resume' : 'Cancel' }} Object</v-card-title>
            <v-card-text> {{ objectDialogData.info.name }}</v-card-text>
            <v-card-actions>
               <v-row no-gutters>
                  <v-col cols="6">
                     <v-btn block @click="objectDialogCancelObject" color="primary">Ok</v-btn>
                  </v-col>
                  <v-col cols="6">
                     <v-btn block @click="objectDialogData.showDialog = false" color="error">Cancel</v-btn>
                  </v-col>
               </v-row>
            </v-card-actions>
         </v-card>
      </v-dialog>
   </div>
</template>

<script>
  //<v-row> <v-col>{{ move }}</v-col></v-row>

  import gcodeViewer from './viewer/gcodeviewer.js';
  import { mapActions, mapState } from 'vuex';
  import Path from '../../utils/path.js';
  import { StatusType, KinematicsName } from '../../store/machine/modelEnums';

  let viewer = {};

  export default {
     data: () => ({
        extruderColors: ['#00FFFFFF', '#FF00FFFF', '#FFFF00FF', '#000000FF', '#FFFFFFFF'],
        backgroundColor: '#000000FF',
        progressColor: '#FFFFFFFF',
        viewerHeight: '400px',
        testValue: 'Test',
        loading: false,
        testData: '',
        showCursor: false,
        showTravelLines: false,
        selectedFile: '',
        nthRow: 1,
        renderQuality: 0,
        debugVisible: false,
        maxHeight: 0,
        sliderHeight: 0,
        sliderBottomHeight: 0,
        liveZTracking: false,
        forceWireMode: false,
        vertexAlpha: false,
        spreadLines: false,
        showObjectSelection: false,
        objectDialogData: {
           showDialog: false,
           info: {},
        },
     }),
     computed: {
        ...mapState('machine/model', ['job', 'move', 'state']),
        isJobRunning: (state) => state.state.status === StatusType.simulating || state.state.status === StatusType.processing,
        visualizingCurrentJob: function (state) {
           try {
              return state.job.file.fileName === this.selectedFile;
           } catch {
              return false;
           }
        },
        filePosition: (state) => state.job.filePosition,
        fileSize: (state) => state.job.file.size,
        kinematicsName: (state) => state.move.kinematics.name,
        isDelta() {
           return this.kinematicsName === KinematicsName.delta || this.kinematicsName === KinematicsName.rotaryDelta;
        },
        canCancelObject() {
           if (!this.isJobRunning || !this.job || !this.job.build || this.job.build.objects.length == 0) {
              return false;
           }
           return this.visualizingCurrentJob;
        },
        jobSelectionLabel() {
           if (!(this.canCancelObject && this.job.build.objects)) {
              return 'Show Object Selction';
           } else {
              return 'Show Object Selection(' + this.job.build.objects.length + ')';
           }
        },
     },
     mounted() {
        viewer = new gcodeViewer(this.$refs.viewerCanvas);
        viewer.isDelta = this.isDelta;
        viewer.objectCallback = this.objectSelectionCallback;
        viewer.init();

        this.renderQuality = viewer.renderQuality;
        this.extruderColors = viewer.getExtruderColors();
        this.backgroundColor = viewer.getBackgroundColor();
        this.progressColor = viewer.getProgressColor();
        this.viewModelEvent = async (path) => {
           this.selectedFile = path;
           this.loading = true;
           let blob = await this.machineDownload({
              filename: Path.combine(path),
              type: 'text',
           });
           try {
              await viewer.processFile(blob);
              this.maxHeight = viewer.getMaxHeight();
              this.sliderHeight = this.maxHeight;
           } finally {
              this.loading = false;
           }
        };

        viewer.setLiveTracking(this.isJobRunning && this.visualizingCurrentJob);

        this.$root.$on('view-3d-model', this.viewModelEvent);

        this.$nextTick(() => {
           viewer.saveExtruderColors(this.extruderColors);
        });
     },
     beforeDestroy() {
        this.$root.$off('view-3d-model', this.viewModelEvent);
     },
     methods: {
        ...mapActions('machine', {
           machineDownload: 'download',
           sendCode: 'sendCode',
        }),
        updateColor(index, value) {
           this.$set(this.extruderColors, index, value);
           viewer.saveExtruderColors(this.extruderColors);
        },
        updateBackground(value) {
           this.backgroundColor = value;
           viewer.setBackgroundColor(this.backgroundColor);
        },
        updateProgressColor(value) {
           this.progressColor = value;
           viewer.setProgressColor(value);
        },
        resize() {
           if (Object.keys(viewer).length !== 0) {
              viewer.resize();
           }
        },
        reset() {
           if (Object.keys(viewer).length !== 0) {
              viewer.resetCamera();
           }
        },
        async loadRunningJob() {
           this.loading = true;
           this.selectedFile = this.job.file.fileName;
           let blob = await this.machineDownload({
              filename: this.job.file.fileName,
              type: 'text',
           });
           try {
              viewer.gcodeProcessor.forceWireMode = this.forceWireMode;
              await viewer.processFile(blob);
              this.maxHeight = viewer.getMaxHeight();
              this.sliderHeight = this.maxHeight;
           } finally {
              this.loading = false;
           }
        },
        resetExtruderColors() {
           this.extruderColors = ['#00FFFFFF', '#FF00FFFF', '#FFFF00FF', '#000000FF', '#FFFFFFFF'];
           viewer.saveExtruderColors(this.extruderColors);
        },
        reloadviewer() {
           if (this.loading) {
              return;
           }
           this.loading = true;
           viewer.gcodeProcessor.forceWireMode = this.forceWireMode;
           viewer.reload().finally(() => {
              this.loading = false;
              viewer.setCursorVisiblity(this.showCursor);
              viewer.toggleTravels(this.showTravelLines);
              this.maxHeight = viewer.getMaxHeight();
              this.sliderHeight = this.maxHeight;
              this.sliderBottomHeight = 0;
              try {
                 viewer.loadObjectBoundaries(this.job.build.objects);
              } catch {
                 console.warn('No objects');
              }
           });
        },
        clearScene() {
           viewer.clearScene();
        },
        objectSelectionCallback(selectedObject) {
           this.objectDialogData.showDialog = true;
           this.objectDialogData.info = selectedObject;
        },
        async objectDialogCancelObject() {
           this.objectDialogData.showDialog = false;
           let action = this.objectDialogData.info.cancelled ? 'U' : 'P';
           await this.sendCode(`M486 ${action}${this.objectDialogData.info.index}`);
           this.objectDialogData.info = {};
        },
     },
     watch: {
        move: {
           handler(newValue) {
              var newPosition = newValue.axes.map((item) => ({
                 axes: item.letter,
                 position: item.machinePosition,
              }));
              viewer.updateToolPosition(newPosition);
              if (this.liveZTracking) {
                 viewer.setZClipPlane(viewer.toolCursor.absolutePosition.y, 0);
              }
           },
           deep: true,
        },
        showCursor: function (newValue) {
           viewer.setCursorVisiblity(newValue);
        },
        showTravelLines: (newVal) => {
           viewer.toggleTravels(newVal);
        },
        visualizingCurrentJob: function (newValue) {
           viewer.setLiveTracking(this.isJobRunning && newValue);
           if (newValue == false) {
              viewer.doFinalPass();
           }
        },
        filePosition: function (newValue) {
           let progressPercent = newValue / this.fileSize;
           viewer.updatePrintProgress(progressPercent);
        },
        nthRow: function (newValue) {
           viewer.gcodeProcessor.everyNthRow = newValue;
        },
        renderQuality: function (newValue) {
           if (viewer.renderQuality !== newValue) {
              viewer.updateRenderQuality(newValue);
              this.reloadviewer();
           }
        },
        sliderHeight: function (newValue) {
           if (this.sliderBottomHeight > newValue) this.sliderBottomHeight = newValue - 1;
           viewer.setZClipPlane(newValue, this.sliderBottomHeight);
        },
        sliderBottomHeight: function (newValue) {
           if (this.sliderHeight < newValue) this.sliderHeight = newValue + 1;
           viewer.setZClipPlane(this.sliderHeight, newValue);
        },
        vertexAlpha: function (newValue) {
           viewer.gcodeProcessor.lineVertexAlpha = newValue;
           this.reloadviewer();
        },
        spreadLines: function (newValue) {
           viewer.gcodeProcessor.spreadLines = newValue;
           this.reloadviewer();
        },
        'job.build.objects': {
           deep: true,
           handler(newValue) {
              viewer.loadObjectBoundaries(newValue);
           },
        },
        showObjectSelection: function (newValue) {
           if (this.canCancelObject) {
              viewer.loadObjectBoundaries(this.job.build.objects);
              viewer.showObjectSelection(newValue);
           } else {
              this.showObjectSelection = false;
           }
        },
        isJobRunning: function (newValue) {
           if (!newValue) {
              viewer.updatePrintProgress(0);
           }
        },
     },
  };
</script>

<style scoped>
  .control-panel {
     overflow-y: auto;
  }

  .babylon-canvas {
     position: relative;
     width: 100%;
     min-height: 300px;
     height: 100%;
  }

  .btn-toggle {
     flex-direction: column;
  }

  .controls {
     position: absolute;
     overflow-y: auto;
     overflow-x: hidden;
     top: 0;
     left: 0;
     width: 20%;
     height: 100%;
  }
  .viewer-box {
     position: absolute;
     top: 0;
     right: 0;
     width: 80%;
     height: 100%;
  }

  .primary-container {
     position: relative;
     width: 100%;
     height: 70vh;
  }
</style>