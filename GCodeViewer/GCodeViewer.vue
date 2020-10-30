<template>
        <v-row justify="center" class="mt-3" dense v-resize="resize">
            <v-col cols="2" class="control-panel" :style="{ 'max-height': viewerHeight }">
                <v-card>
                    <v-btn @click="reset" block>Reset View</v-btn>
                    <v-btn @click="reloadviewer" :disabled="loading" block>Reload View</v-btn>
                    <v-btn @click="loadRunningJob" :disabled="!isJobRunning || loading || visualizingCurrentJob" block>Load Current Job</v-btn>
                    <v-btn @click="clearScene" v-show="debugVisible" :disabled="loading" block>Clear Scene</v-btn>
                    <v-checkbox v-model="showCursor" label="Show Cursor"></v-checkbox>
                    <!--v-checkbox v-model="showTravelLines" label="Show Travels"></v-checkbox-->
                </v-card>
                <v-card>
                  <h3>Render Quality</h3>
                  <v-btn-toggle exclusive mandatory v-model="renderQuality" class="btn-toggle">
                    <v-btn :value="1">Low</v-btn>
                    <v-btn :value="2">Medium</v-btn>
                    <v-btn :value="3">High</v-btn>
                    <v-btn :value="4">Ultra</v-btn>
                    <v-btn :value="5">Max</v-btn>
                  </v-btn-toggle>
                  <v-checkbox v-model="forceWireMode" label="Force Line Rendering"></v-checkbox>
                </v-card>
                <v-card v-for="(extruder, index) in extruderColors" :key="index">
                    <h3>Tool {{ index.axes }}</h3>
                    <gcodeviewer-color-picker
                        :editcolor="extruder"
                        @updatecolor="(value) => {updateColor(index, value);}">
                    </gcodeviewer-color-picker>
                </v-card>
                <v-card>
                    <v-btn block @click="resetExtruderColors">Reset Extruder Colors</v-btn>
                </v-card>
                <v-card>
                    <v-slider min="0.1" :max="maxHeight" v-model="sliderHeight" thumb-label thumb-size="24" label="Height Slider" step="0.1"></v-slider>
                    <v-slider min="0.1" :max="maxHeight" v-model="sliderBottomHeight" thumb-label thumb-size="24" label="Height Slider" step="0.1"></v-slider>

                    <v-checkbox v-model="liveZTracking" label="Live Z Tracking"></v-checkbox>
                </v-card>
                <v-card>
                    <h3>Background</h3>
                    <gcodeviewer-color-picker :editcolor="backgroundColor" @updatecolor="(value) => updateBackground(value)"></gcodeviewer-color-picker>
                </v-card>
                <v-card v-show="debugVisible">
                  <h3>Render Mode (Disabled)</h3>
                  <v-btn-toggle exclusive v-model="renderMode">
                    <v-btn :value="1">Line</v-btn>
                    <v-btn :value="2">3D</v-btn>
                    <v-btn :value="3">Point</v-btn>
                  </v-btn-toggle>
                  <h3>Render n-th row (Disabled)</h3>  
                  <v-btn-toggle exclusive v-model="nthRow">
                    <v-btn :value="1">1</v-btn>
                    <v-btn :value="2">2</v-btn>
                    <v-btn :value="3">3</v-btn>
                  </v-btn-toggle>
                </v-card>
            </v-col>
            <v-col cols="10" block>
                <canvas ref="viewerCanvas" class="babylon-canvas"/>
            </v-col>
        </v-row>
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
      viewerHeight: '400px',
      testValue: 'Test',
      loading: false,
      testData: '',
      showCursor: true,
      showTravelLines: false,
      selectedFile: '',
      renderMode: 1,
      nthRow: 1,
      renderQuality: 0,
      debugVisible: false,
      maxHeight: 0,
      sliderHeight: 0,
      sliderBottomHeight: 0,
      liveZTracking: false,
      forceWireMode: false,
    }),
    computed: {
      ...mapState('machine/model', ['job', 'move', 'state']),
      isJobRunning: (state) => state.state.status === StatusType.simulating || state.state.status === StatusType.processing,
      visualizingCurrentJob: function (state) {
        return state.job.file.fileName === this.selectedFile;
      },
      filePosition: (state) => state.job.filePosition,
      fileSize: (state) => state.job.file.size,
      kinematicsName: (state) => state.move.kinematics.name,
      isDelta() {
        return this.kinematicsName === KinematicsName.delta || this.kinematicsName === KinematicsName.rotaryDelta;
      },
    },
    mounted() {
      viewer = new gcodeViewer(this.$refs.viewerCanvas);
      viewer.isDelta = this.isDelta;
      viewer.init();

      this.renderQuality = viewer.renderQuality;
      this.extruderColors = viewer.getExtruderColors();
      this.backgroundColor = viewer.getBackgroundColor();

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
        this.updateControlHeight();
        viewer.saveExtruderColors(this.extruderColors);
      });
    },
    beforeDestroy() {
      this.$root.$off('view-3d-model', this.viewModelEvent);
    },
    methods: {
      ...mapActions('machine', {
        machineDownload: 'download',
      }),
      updateColor(index, value) {
        this.$set(this.extruderColors, index, value);
        viewer.saveExtruderColors(this.extruderColors);
      },
      updateBackground(value) {
        this.backgroundColor = value;
        viewer.setBackgroundColor(this.backgroundColor);
      },
      updateControlHeight() {
        this.viewerHeight = this.$refs.viewerCanvas.clientHeight + 'px';
      },
      resize() {
        if (Object.keys(viewer).length !== 0) {
          viewer.resize();
          this.updateControlHeight();
        }
      },
      reset() {
        if (Object.keys(viewer).length !== 0) {
          viewer.resetCamera();
          this.updateControlHeight();
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
        });
      },
      clearScene() {
        viewer.clearScene();
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
      renderMode: function (newValue) {
        viewer.gcodeProcessor.renderVersion = newValue;
        viewer.reload();
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
    },
  };
</script>

<style scoped>
  .control-panel {
    overflow-y: auto;
  }

  .babylon-canvas {
    width: 100%;
    min-height: 300px;
  }

  .btn-toggle {
    flex-direction: column;
  }
</style>