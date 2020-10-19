import { registerRoute } from '../../routes'
import { registerPluginContextMenuItem, ContextMenuType } from '../../store'
import GCodeViewer from './GCodeViewer.vue'
import ColorPicker from './ColorPicker.vue'
import Vue from 'vue'
Vue.component('gcodeviewer-color-picker', ColorPicker);

registerRoute(GCodeViewer, {
    Job: {
        GCodeViewer: {
            icon: 'mdi-rotate-3d',
            caption: 'GCode Viewer',
            path: '/GCodeViewer'
        }
    }
});

registerPluginContextMenuItem('View 3D', '/GCodeViewer', 'mdi-rotate-3d', 'view-3d-model', ContextMenuType.JobFileList);

/*
export default
    {
        install(Vue) {
            Vue.component('gcodeviewer-color-picker', ColorPicker);

            registerRoute(GCodeViewer, {
                Job: {
                    GCodeViewer: {
                        icon: 'mdi-rotate-3d',
                        caption: 'GCode Viewer',
                        path: '/GCodeViewer'
                    }
                }
            });

            registerPluginContextMenuItem('View 3D', '/GCodeViewer', 'mdi-rotate-3d', 'view-3d-model', ContextMenuType.JobFileList);
        }
    }

    */