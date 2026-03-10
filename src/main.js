import './style.css'
import 'reveal.js/dist/reveal.css'
import 'reveal.js/dist/theme/black.css'
import Reveal from 'reveal.js'
import { Workbench } from './engine/Workbench.js'
import { CubeDemo } from './demos/CubeDemo.js'
import { Demo1_RawData } from './demos/Demo1_RawData.js'
import { Demo2_Transform } from './demos/Demo2_Transform.js'
import { Demo3_Pipeline } from './demos/Demo3_Pipeline.js'
import { Demo4_Lighting } from './demos/Demo4_Lighting.js'
import { Demo5_SceneGraph } from './demos/Demo5_SceneGraph.js'
import { Demo6_Camera } from './demos/Demo6_Camera.js'
import { Demo7_PBR } from './demos/Demo7_PBR.js'
import { Demo8_Raytracing } from './demos/Demo8_Raytracing.js'
import { Demo9_Picking } from './demos/Demo9_Picking.js'
import { Demo10_LOD } from './demos/Demo10_LOD.js'


const workbenchContainer = document.getElementById('workbench-container');
const workbench = new Workbench(workbenchContainer);

const demos = {
    'cube': CubeDemo,
    'raw-data': Demo1_RawData,
    'transform': Demo2_Transform,
    'pipeline': Demo3_Pipeline,
    'lighting': Demo4_Lighting,
    'scenegraph': Demo5_SceneGraph,
    'camera': Demo6_Camera,
    'pbr': Demo7_PBR,
    'raytracing': Demo8_Raytracing,
    'picking': Demo9_Picking,
    'lod': Demo10_LOD
};


const deck = new Reveal({
  embedded: true,
  controls: true,
  hash: true,
  disableLayout: false,
  center: true
});

deck.on('slidechanged', (event) => {
    updateSlide(event.currentSlide);
});

function updateSlide(slide) {
    const demoId = slide.dataset.demo;
    const slidesContainer = document.getElementById('slides-container');
    
    if (demoId && demos[demoId]) {
        // Show workbench
        workbenchContainer.style.display = 'block';
        slidesContainer.style.flex = '1';
        
        const isSameDemo = workbench.currentDemo instanceof demos[demoId];
        
        if (!isSameDemo) {
            workbench.loadDemo(new demos[demoId](workbench.renderer));
        }
    } else {
        // Hide workbench
        workbench.disposeCurrent();
        workbenchContainer.style.display = 'none';
        slidesContainer.style.flex = 'none';
        slidesContainer.style.width = '100%';
    }


    if (slide.dataset.stage && workbench.currentDemo && workbench.currentDemo.setStage) {
        workbench.currentDemo.setStage(slide.dataset.stage);
    }
}

deck.initialize().then(() => {
    updateSlide(deck.getCurrentSlide());
});
