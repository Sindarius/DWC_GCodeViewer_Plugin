<template>
    <v-container fill-height>
        <v-row justify="center" class="mt-3" dense v-resize="resize">
            <v-col cols="2" class="control-panel" :style="{ 'max-height': viewerHeight }">
                <v-card>
                    <v-btn @click="reset" block>Reset View</v-btn>
                    <v-btn @click="reloadviewer" :disabled="loading" block>Reload View</v-btn>
                    <v-btn @click="loadRunningJob" :disabled="!isJobRunning || loading || visualizingCurrentJob" block>Load Current Job</v-btn>
                    <v-checkbox v-model="showCursor" label="Show Cursor"></v-checkbox>
                    <v-checkbox v-model="showTravelLines" label="Show Travels"></v-checkbox>
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
                    <h3>Background</h3>
                    <gcodeviewer-color-picker :editcolor="backgroundColor" @updatecolor="(value) => updateBackground(value)"></gcodeviewer-color-picker>
                </v-card>
            </v-col>
            <v-col cols="10" block>
                <canvas ref="viewerCanvas" class="babylon-canvas" />
            </v-col>
        </v-row>
    </v-container>
</template>

<script>

//<v-row> <v-col>{{ move }}</v-col></v-row>

import gcodeViewer from "./viewer/gcodeviewer.js";
import { mapActions, mapState } from "vuex";
import Path from "../../utils/path.js";
import { StatusType, KinematicsName } from "../../store/machine/modelEnums";


let viewer = {};

export default {
  data: () => ({
    extruderColors: [
      "#00FFFFFF",
      "#FF00FFFF",
      "#FFFF00FF",
      "#000000FF",
      "#FFFFFFFF",
    ],
    backgroundColor: "#000000FF",
    viewerHeight: "400px",
    testValue: "Test",
    loading: false,
    testData: "",
    showCursor: true,
    showTravelLines: false,
    selectedFile: "",
  }),
  computed: {
    ...mapState("machine/model", ["job", "move", "state"]),
    isJobRunning: (state) =>
      state.state.status === StatusType.simulating ||
      state.state.status === StatusType.processing,
    visualizingCurrentJob: function (state) {
      return state.job.file.fileName === this.selectedFile;
    },
    filePosition: (state) => state.job.filePosition,
    fileSize: (state) => state.job.file.size,
    kinematicsName: (state) => state.move.kinematics.name,
    isDelta() {
      return ( 
        this.kinematicsName === KinematicsName.delta ||
        this.kinematicsName === KinematicsName.rotaryDelta
      );
    },
  },
  mounted() {
    viewer = new gcodeViewer(this.$refs.viewerCanvas);
    viewer.isDelta = this.isDelta;
    viewer.init();

    this.extruderColors = viewer.getExtruderColors();
    this.backgroundColor = viewer.getBackgroundColor();

    this.viewModelEvent = async (path) => {
      this.selectedFile = path;
      this.loading = true;
      let blob = await this.machineDownload({
        filename: Path.combine(path),
        type: "text",
      });
      try {
        await viewer.processFile(blob);
      } finally {
        this.loading = false;
      }
    };

    viewer.setLiveTracking(this.isJobRunning && this.visualizingCurrentJob);

    this.$root.$on("view-3d-model", this.viewModelEvent);

    this.$nextTick(() => {
      this.updateControlHeight();
      viewer.saveExtruderColors(this.extruderColors);
    });
  },
  beforeDestroy() {
    this.$root.$off("view-3d-model", this.viewModelEvent);
  },
  methods: {
    ...mapActions("machine", {
      machineDownload: "download",
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
      this.viewerHeight = this.$refs.viewerCanvas.clientHeight + "px";
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
        type: "text",
      });
      try {
        await viewer.processFile(blob);
      } finally {
        this.loading = false;
      }
    },
    resetExtruderColors() {
      this.extruderColors = [
        "#00FFFFFF",
        "#FF00FFFF",
        "#FFFF00FF",
        "#000000FF",
        "#FFFFFFFF",
      ];
      viewer.saveExtruderColors(this.extruderColors);
    },
    reloadviewer() {
      if (this.loading) {
        return;
      }
      this.loading = true;
      viewer.reload().finally(() => {
        this.loading = false;
        viewer.setCursorVisiblity(this.showCursor);
        viewer.showTravelLines(this.showTravelLines);
      });
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
      if(newValue == false){
        viewer.doFinalPass();
      }
    },
    filePosition: function (newValue) {
      let progressPercent = newValue / this.fileSize;
      viewer.updatePrintProgress(progressPercent);
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
  min-height: 400px;
}


</style>