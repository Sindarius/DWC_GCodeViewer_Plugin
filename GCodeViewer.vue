<template>
  <v-container fill-height>
    <v-row justify="center" no-gutters class="mt-3" dense v-resize="resize">
      <v-col
        cols="2"
        class="control-panel"
        :style="{ 'max-height': viewerHeight }">
        <v-card>
          <v-btn @click="reset" block>Reset View</v-btn>
          <v-btn @click="reloadviewer" :disabled="loading" block>Reload View</v-btn
          >
        </v-card>
        <v-card v-for="(extruder, index) in extruderColors" :key="index">
          <h3>Tool {{ index }}</h3>
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
import gcodeViewer from "./viewer/gcodeviewer.js";
import { mapActions } from "vuex";
import Path from "../../utils/path.js";

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
  }),
  computed: {},
  mounted() {
    viewer = new gcodeViewer(this.$refs.viewerCanvas);
    viewer.init();

    this.extruderColors = viewer.getExtruderColors();
    this.backgroundColor = viewer.getBackgroundColor();

    this.viewModelEvent = async (path) => {
      this.loading = true;
      let blob = await this.machineDownload({
        filename: Path.combine(path),
        type: "text",
      });
      await viewer.processFile(blob);
      this.loading = false;
    };

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
    updateBackground(value){
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
    resetExtruderColors(){
      this.extruderColors = [
      "#00FFFFFF",
      "#FF00FFFF",
      "#FFFF00FF",
      "#000000FF",
      "#FFFFFFFF",];
      viewer.saveExtruderColors(this.extruderColors);
    },
    reloadviewer() {
      if(this.loading){
        return;
      }
      this.loading = true;
      viewer.reload().finally(() => {this.loading= false});  
      },
    toggleLoading() {
      this.loading = !this.loading;
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
}
</style>