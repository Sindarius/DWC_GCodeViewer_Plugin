
<style scoped>
.babylon-canvas {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.btn-toggle {
	flex-direction: column;
}

.primary-container {
	position: relative;
	width: 100%;
	height: 100%;
	background-color: green;
}

.v-input--checkbox {
	margin: 0;
	padding: 0;
}

.v-input--switch {
	margin: 0;
	padding: 0;
}
.viewer-box {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: yellow;
}

.full-screen {
	position: fixed;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	z-index: 10;
}

.full-screen-icon {
	height: 40px;
	width: 40px;
}

.drawer-zindex {
	z-index: 20;
}
.button-container {
	position: absolute;
	top: 5px;
	left: 5px;
	-webkit-transition-duration: 0.3s;
	-moz-transition-duration: 0.3s;
	-o-transition-duration: 0.3s;
	transition-duration: 0.3s;
}

.button-container-drawer {
	left: 355px;
}
.emergency-button-placement {
	position: absolute;
	top: 14px;
	right: 16px;
	z-index: 999;
}
.viewer-box >>> #scene-explorer-host {
	position: absolute !important;
	left: calc(100% - 605px);
	width: 300px;
	top: 0px;
	z-index: 50 !important;
}
</style>

<template>
	<div ref="primarycontainer" id="primarycontainer" class="primary-container mt-2" v-resize="resize">
		<div :class="{ 'full-screen': fullscreen }" class="viewer-box">
			<div class="emergency-button-placement" v-show="fullscreen">
				<code-btn :code="'M112\nM999'" :log="false" color="red" :title="$t('button.emergencyStop.title')"><v-icon>mdi-flash</v-icon></code-btn>
			</div>
			<canvas ref="viewerCanvas" class="babylon-canvas" :title="hoverLabel"></canvas>
			<div class="button-container" :class="{ 'button-container-drawer': drawer }">
				<v-btn class="full-screen-icon mb-2" small @click="toggleFullScreen">
					<v-icon>{{ fullscreen ? 'mdi-window-restore' : 'mdi-window-maximize' }}</v-icon>
				</v-btn>
				<br />
				<v-btn small class="toggle-menu-button-close mb-10" @click="drawer = !drawer"><v-icon>mdi-cog</v-icon></v-btn>
				<br />
				<v-btn small class="toggle-menu-button-close" v-show="loading" @click="cancelLoad" title="Cancel File Loading"><v-icon color="red">mdi-cancel</v-icon></v-btn>
			</div>
			<v-navigation-drawer v-model="drawer" :permanent="drawer" absolute width="350px">
				<v-card>
					<v-btn @click="reset" block>
						<v-icon class="mr-2">mdi-camera</v-icon>
						Reset Camera
					</v-btn>
					<v-btn class="mt-2" @click="reloadviewer" :disabled="loading" block>
						<v-icon class="mr-2">mdi-reload-alert</v-icon>
						Reload View
					</v-btn>
					<v-btn class="mt-2" @click="loadRunningJob" :disabled="!isJobRunning || loading || visualizingCurrentJob" block>
						<v-icon class="mr-2">mdi-printer-3d</v-icon>
						Load Current Job
					</v-btn>
					<v-btn class="mt-2" @click="clearScene" :disabled="loading" block>
						<v-icon class="mr-2">mdi-video-3d-off</v-icon>
						Unload GCode
					</v-btn>
					<v-btn class="mt-2" @click="chooseFile" :disabled="loading" block>
						<v-icon>mdi-file</v-icon>
						Local GCode File
					</v-btn>
					<input ref="fileInput" type="file" :accept="'.g,.gcode,.gc,.gco,.nc,.ngc,.tap'" hidden @change="fileSelected" multiple />
					<v-switch class="mt-4" v-model="showObjectSelection" :disabled="!canCancelObject" :label="jobSelectionLabel"></v-switch>
					<v-switch v-model="showCursor" label="Show Cursor"></v-switch>
					<v-switch v-model="showTravelLines" label="Show Travels"></v-switch>
				</v-card>
				<v-expansion-panels>
					<v-expansion-panel @click="scrollIntoView">
						<v-expansion-panel-header>
							<v-icon class="mr-2">mdi-checkerboard</v-icon>
							<strong>Render Quality</strong>
						</v-expansion-panel-header>
						<v-expansion-panel-content eager>
							<v-btn-toggle block exclusive v-model="renderQuality" class="btn-toggle d-flex">
								<v-btn block :value="1" :disabled="loading">SBC</v-btn>
								<v-btn block :value="2" :disabled="loading">Low</v-btn>
								<v-btn block :value="3" :disabled="loading">Medium</v-btn>
								<v-btn block :value="4" :disabled="loading">High</v-btn>
								<v-btn block :value="5" :disabled="loading">Ultra</v-btn>
								<v-btn block :value="6" :disabled="loading">Max</v-btn>
							</v-btn-toggle>
							<v-checkbox class="mt-4" v-model="forceWireMode" label="Force Line Rendering"></v-checkbox>
							<v-checkbox v-model="vertexAlpha" label="Transparency"></v-checkbox>
							<v-checkbox v-model="liveTrackingShowSolid" :disabled="!isJobRunning || loading || !visualizingCurrentJob" label="Show Solid (Current Job)"></v-checkbox>
							<v-checkbox v-model="spreadLines" label="Spread Lines"></v-checkbox>
						</v-expansion-panel-content>
					</v-expansion-panel>
					<v-expansion-panel @click="scrollIntoView">
						<v-expansion-panel-header>
							<v-icon class="mr-2">mdi-printer-3d-nozzle</v-icon>
							<strong>Extruders</strong>
						</v-expansion-panel-header>
						<v-expansion-panel-content>
							<v-btn class="mb-2" @click="reloadviewer" :disabled="loading" block color="primary">Reload View</v-btn>
							<v-card v-for="(extruder, index) in extruderColors" :key="index">
								<h3>Tool {{ index }}</h3>
								<gcodeviewer-color-picker
									:editcolor="extruder"
									@updatecolor="
										value => {
											updateColor(index, value);
										}
									"
								></gcodeviewer-color-picker>
							</v-card>
							<v-card>
								<v-btn block class="mt-4" @click="resetExtruderColors" color="warning">Reset Extruder Colors</v-btn>
							</v-card>
						</v-expansion-panel-content>
					</v-expansion-panel>
					<v-expansion-panel @click="scrollIntoView">
						<v-expansion-panel-header>
							<v-icon class="mr-2">mdi-palette</v-icon>
							<strong>Color</strong>
						</v-expansion-panel-header>
						<v-expansion-panel-content>
							<v-card>
								<h4>Color Mode</h4>
								<v-btn-toggle block exclusive v-model="colorMode" class="btn-toggle d-flex">
									<v-btn block :value="0" :disabled="loading">Color</v-btn>
									<v-btn block :value="1" :disabled="loading">Feed</v-btn>
								</v-btn-toggle>
								<h4>Min Feed Rate (mm/s)</h4>
								<slider v-model="minColorRate" :min="5" :max="500"></slider>
								<h4>Max Feed Rate (mm/s) {{ displayMaxFileFeedRate() }}</h4>
								<slider v-model="maxColorRate" :min="5" :max="500"></slider>
								<h4>Min</h4>
								<gcodeviewer-color-picker :editcolor="minFeedColor" @updatecolor="value => updateMinFeedColor(value)"></gcodeviewer-color-picker>
								<h4>Max</h4>
								<gcodeviewer-color-picker :editcolor="maxFeedColor" @updatecolor="value => updateMaxFeedColor(value)"></gcodeviewer-color-picker>
								<v-btn class="mb-2" @click="reloadviewer" :disabled="loading" block color="primary">Reload View</v-btn>
							</v-card>
						</v-expansion-panel-content>
					</v-expansion-panel>
					<v-expansion-panel @click="scrollIntoView">
						<v-expansion-panel-header>
							<v-icon class="mr-2">mdi-progress-clock</v-icon>
							<strong>Progress</strong>
						</v-expansion-panel-header>
						<v-expansion-panel-content>
							<v-card>
								<div>Top Clipping</div>
								<v-slider min="0.1" :max="maxHeight" v-model="sliderHeight" thumb-label thumb-size="24" step="0.1"></v-slider>
								<div>Bottom Clipping</div>
								<v-slider min="0.1" :max="maxHeight" v-model="sliderBottomHeight" thumb-label thumb-size="24" step="0.1"></v-slider>
								<v-checkbox v-model="liveZTracking" label="Live Z Tracking"></v-checkbox>
							</v-card>
							<v-card>
								<v-card-title>Progress Color</v-card-title>
								<v-card-text>
									<gcodeviewer-color-picker :editcolor="progressColor" @updatecolor="value => updateProgressColor(value)"></gcodeviewer-color-picker>
								</v-card-text>
							</v-card>
						</v-expansion-panel-content>
					</v-expansion-panel>
					<v-expansion-panel @click="scrollIntoView">
						<v-expansion-panel-header>
							<v-icon class="mr-2">mdi-cog</v-icon>
							<strong>Settings</strong>
						</v-expansion-panel-header>
						<v-expansion-panel-content>
							<v-card>
								<v-card-title>Background</v-card-title>
								<gcodeviewer-color-picker :editcolor="backgroundColor" @updatecolor="value => updateBackground(value)"></gcodeviewer-color-picker>
							</v-card>
							<v-card>
								<v-card-title>Bed Render Mode</v-card-title>
								<v-btn-toggle v-model="bedRenderMode" class="d-flex flex-column">
									<v-btn block :value="0">Bed</v-btn>
									<v-btn block :value="1">Volume</v-btn>
								</v-btn-toggle>
								<gcodeviewer-color-picker :editcolor="bedColor" @updatecolor="value => updateBedColor(value)"></gcodeviewer-color-picker>
							</v-card>
							<v-card>
								<v-card-text>
									<v-checkbox v-model="showAxes" label="Show Axes"></v-checkbox>
									<v-checkbox v-model="showObjectLabels" label="Show Object Labels"></v-checkbox>
									<v-switch v-model="cameraInertia" label="Camera Inertia"></v-switch>
								</v-card-text>
							</v-card>
						</v-expansion-panel-content>
					</v-expansion-panel>
				</v-expansion-panels>
			</v-navigation-drawer>
		</div>
		<v-dialog v-model="objectDialogData.showDialog" max-width="300">
			<v-card>
				<v-card-title class="headline">
					<v-icon class="mr-2">{{ objectDialogData.info.cancelled ? 'mdi-reload' : 'mdi-cancel' }}</v-icon>
					{{ objectDialogData.info.cancelled ? 'Resume' : 'Cancel' }} Object
				</v-card-title>
				<v-card-text>{{ objectDialogData.info.name }}</v-card-text>
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
'use strict';

import gcodeViewer from './viewer/gcodeviewer.js';
import { mapActions, mapState } from 'vuex';
import Path from '../../utils/path.js';
import { StatusType, KinematicsName } from '../../store/machine/modelEnums';

let viewer = {};

export default {
	data: () => ({
		drawer: false,
		extruderColors: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000', '#FFFFFF'],
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
		renderQuality: 1,
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
		hoverLabel: '',
		bedRenderMode: 0,
		showAxes: true,
		showObjectLabels: true,
		liveTrackingShowSolid: false,
		fullscreen: false,
		bedColor: '',
		colorMode: 0,
		minColorRate: 20,
		maxColorRate: 60,
		maxFileFeedRate: 0,
		minFeedColor: '#0000FF',
		maxFeedColor: '#FF0000',
		cameraInertia : true
	}),
	computed: {
		...mapState('machine/model', ['job', 'move', 'state']),
		isJobRunning: state => state.state.status === StatusType.simulating || state.state.status === StatusType.processing,
		visualizingCurrentJob: function (state) {
			try {
				return state.job.file.fileName === this.selectedFile && this.isJobRunning;
			} catch {
				return false;
			}
		},
		filePosition: state => state.job.filePosition,
		fileSize: state => state.job.file.size,
		kinematicsName: state => state.move.kinematics.name,
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
				return 'Show Object Selection';
			} else {
				return 'Show Object Selection(' + this.job.build.objects.length + ')';
			}
		},
	},
	mounted() {
		viewer = new gcodeViewer(this.$refs.viewerCanvas);
		viewer.init();

		viewer.buildObjects.objectCallback = this.objectSelectionCallback;
		viewer.buildObjects.labelCallback = label => {
			if (this.showObjectSelection) {
				this.hoverLabel = label;
			} else {
				this.hoverLabel = '';
			}
		};
		this.showObjectLabels = viewer.buildObjects.showLabel;

		if (this.move.axes) {
			for (var axesIdx in this.move.axes) {
				let axes = this.move.axes[axesIdx];
				if ('XYZ'.includes(axes.letter)) {
					var letter = axes.letter.toLowerCase();
					viewer.bed.buildVolume[letter].min = axes.min;
					viewer.bed.buildVolume[letter].max = axes.max;
				}
			}
			viewer.bed.commitBedSize();
		}

		this.cameraInertia = viewer.cameraInertia;

		viewer.bed.setDelta(this.isDelta);
		this.bedRenderMode = viewer.bed.renderMode;
		this.bedColor = viewer.bed.getBedColor();
		this.showAxes = viewer.axes.visible;

		this.colorMode = viewer.gcodeProcessor.colorMode;
		this.minFeedColor = viewer.gcodeProcessor.minFeedColorString;
		this.maxFeedColor = viewer.gcodeProcessor.maxFeedColorString;
		this.minColorRate = viewer.gcodeProcessor.minColorRate / 60;
		this.maxColorRate = viewer.gcodeProcessor.maxColorRate / 60;
		this.forceWireMode = viewer.gcodeProcessor.forceWireMode;

		if (viewer.lastLoadFailed()) {
			this.renderQuality = 1;
			viewer.updateRenderQuality(1);
			this.$makeNotification('warning', 'GCode Viewer', 'Previous render failed. Setting render quality to SBC', 5000);
			viewer.clearLoadFlag();
		}
		viewer.setCursorVisiblity(this.showCursor);
		this.renderQuality = viewer.renderQuality;
		this.extruderColors = viewer.getExtruderColors();
		this.backgroundColor = viewer.getBackgroundColor();
		this.progressColor = viewer.getProgressColor();
		this.viewModelEvent = async path => {
			this.selectedFile = path;

			try {
				let blob = await this.machineDownload({
					filename: Path.combine(path),
					type: 'text',
				});
				this.loading = true;

				await viewer.processFile(blob);
				viewer.gcodeProcessor.setLiveTracking(this.visualizingCurrentJob);
				this.maxHeight = viewer.getMaxHeight();
				this.sliderHeight = this.maxHeight;
				this.maxFileFeedRate = viewer.gcodeProcessor.maxFeedRate;
			} finally {
				this.loading = false;
			}
		};

		this.$root.$on('view-3d-model', this.viewModelEvent);

		this.$nextTick(() => {
			viewer.saveExtruderColors(this.extruderColors);
		});

		window.addEventListener('keyup', e => {
			var key = e.key || e.keyCode;
			if (key === 'Escape' || key === 'Esc' || key === 27) {
				this.fullscreen = false;
			}
		});

		//watch for resizing events
		window.addEventListener('resize', () => {
			this.$nextTick(() => {
				this.resize();
			});
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
		updateMinFeedColor(value) {
			viewer.gcodeProcessor.updateMinFeedColor(value);
		},
		updateMaxFeedColor(value) {
			viewer.gcodeProcessor.updateMaxFeedColor(value);
		},
		updateBedColor(value) {
			this.bedColor = value;
			viewer.bed.setBedColor(value);
		},
		resize() {
			this.$refs.primarycontainer.style.height = window.innerHeight - document.getElementById('global-container').clientHeight - document.getElementsByClassName('v-toolbar__content')[0].clientHeight - 22 + 'px';
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
			if (this.selectedFile != this.job.file.fileName) {
				this.selectedFile = '';
				viewer.gcodeProcessor.setLiveTracking(false);
				viewer.clearScene(true);
			}
			this.selectedFile = this.job.file.fileName;

			try {
				let blob = await this.machineDownload({
					filename: this.job.file.fileName,
					type: 'text',
				});

				this.loading = true;
				viewer.gcodeProcessor.setLiveTracking(true);
				viewer.gcodeProcessor.updateForceWireMode(this.forceWireMode);
				await viewer.processFile(blob);
				this.maxHeight = viewer.getMaxHeight();
				this.sliderHeight = this.maxHeight;
				this.maxFileFeedRate = viewer.gcodeProcessor.maxFeedRate;
				viewer.buildObjects.loadObjectBoundaries(this.job.build.objects); //file is loaded lets load the final heights
			} finally {
				this.loading = false;
			}
		},
		resetExtruderColors() {
			this.extruderColors = ['#00FFFF', '#FF00FF', '#FFFF00', '#000000', '#FFFFFF'];
			viewer.saveExtruderColors(this.extruderColors);
			this.extruderColors.forEach((v, i) => {
				this.$set(this.extruderColors, i, v);
			});
			this.extruderColors = viewer.getExtruderColors();
		},
		reloadviewer() {
			if (this.loading) {
				return;
			}
			this.loading = true;
			viewer.gcodeProcessor.updateForceWireMode(this.forceWireMode);
			viewer.gcodeProcessor.setLiveTracking(this.visualizingCurrentJob);

			viewer.reload().finally(() => {
				this.loading = false;
				viewer.setCursorVisiblity(this.showCursor);
				viewer.toggleTravels(this.showTravelLines);
				this.maxHeight = viewer.getMaxHeight();
				this.sliderHeight = this.maxHeight;
				this.sliderBottomHeight = 0;
				this.maxFileFeedRate = viewer.gcodeProcessor.maxFeedRate;
				try {
					viewer.buildObjects.loadObjectBoundaries(this.job.build.objects);
				} catch {
					//console.warn("No objects");
				}
			});
		},
		clearScene() {
			this.selectedFile = '';
			viewer.clearScene(true);
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
		chooseFile() {
			if (!this.isBusy) {
				this.$refs.fileInput.click();
			}
		},
		async fileSelected(e) {
			const reader = new FileReader();
			reader.addEventListener('load', async event => {
				const blob = event.target.result;
				// Do something with result
				await viewer.processFile(blob);
				this.maxHeight = viewer.getMaxHeight();
				this.sliderHeight = this.maxHeight;
				this.loading = false;
				this.maxFileFeedRate = viewer.gcodeProcessor.maxFeedRate;
			});
			this.loading = true;
			reader.readAsText(e.target.files[0]);
			e.target.value = '';
		},
		toggleFullScreen() {
			this.fullscreen = !this.fullscreen;
			this.$nextTick(() => {
				viewer.resize();
			});
		},
		displayMaxFileFeedRate() {
			if (this.maxFileFeedRate > 0) return `(${this.maxFileFeedRate / 60})`;
		},
		cancelLoad() {
			viewer.gcodeProcessor.cancelLoad = true;
		},
		scrollIntoView(event) {
			setTimeout(() => {
				event.target.scrollIntoView(true);
			}, 250);
		},
	},
	activated() {
		viewer.pause = false;
		this.resize();
	},
	deactivated() {
		viewer.pause = true;
	},
	watch: {
		move: {
			handler(newValue) {
				var newPosition = newValue.axes.map(item => ({
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
		showTravelLines: newVal => {
			viewer.toggleTravels(newVal);
		},
		visualizingCurrentJob: function (newValue) {
			if (newValue == false) {
				viewer.gcodeProcessor.doFinalPass();
			}
		},
		filePosition: function (newValue) {
			if (this.visualizingCurrentJob) {
				viewer.gcodeProcessor.updateFilePosition(newValue);
			}
		},
		nthRow: function (newValue) {
			viewer.gcodeProcessor.everyNthRow = newValue;
		},
		renderQuality: function (newValue) {
			if (viewer.renderQuality !== newValue) {
				viewer.updateRenderQuality(newValue);
				if (!this.loading) {
					this.reloadviewer();
				}
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
				if (viewer && viewer.buildObjects) {
					viewer.buildObjects.loadObjectBoundaries(newValue);
				}
			},
		},
		showObjectSelection: function (newValue) {
			if (this.canCancelObject) {
				viewer.buildObjects.loadObjectBoundaries(this.job.build.objects);
				viewer.buildObjects.showObjectSelection(newValue);
			} else {
				this.showObjectSelection = false;
				this.hoverLabel = '';
			}
		},
		isJobRunning: function (newValue) {
			//Need to add a check for paused...
			if (!newValue) {
				viewer.gcodeProcessor.setLiveTracking(false);
				viewer.gcodeProcessor.doFinalPass();
			}
		},
		liveZTracking: function (newValue) {
			if (!newValue) {
				viewer.setZClipPlane(this.maxHeight, 0);
			}
		},
		selectedFile: function () {
			this.showObjectSelection = false;
			viewer.gcodeProcessor.updateFilePosition(0);
		},
		bedRenderMode: function (newValue) {
			viewer.bed.setRenderMode(newValue);
		},
		isDelta: function (newValue) {
			viewer.bed.setDelta(newValue);
			viewer.resetCamera();
		},
		showAxes: function (newValue) {
			viewer.axes.show(newValue);
		},
		showObjectLabels: function (newValue) {
			viewer.buildObjects.showLabels(newValue);
		},
		liveTrackingShowSolid: function (newValue) {
			viewer.gcodeProcessor.liveTrackingShowSolid = newValue;
			this.reloadviewer();
		},
		forceWireMode: function (newValue) {
			viewer.gcodeProcessor.updateForceWireMode(newValue);
			this.reloadviewer();
		},
		colorMode: function (to) {
			viewer.gcodeProcessor.setColorMode(to);
			this.reloadviewer();
		},
		minColorRate: function (to) {
			viewer.gcodeProcessor.updateColorRate(to * 60, this.maxColorRate * 60);
		},
		maxColorRate: function (to) {
			viewer.gcodeProcessor.updateColorRate(this.minColorRate * 60, to * 60);
		},
		cameraInertia: function(to){
			viewer.setCameraInertia(to);
		},
		$route  : function() {
			this.resize();
		}
	},
};
</script>


         <!-- v-row v-for="(m, index) in move.axes" :key="index">
            <v-col :cols="12 / move.length"> {{ m.letter }} {{ m.machinePosition }} {{ m.userPosition }} </v-col>
         </v-row-->