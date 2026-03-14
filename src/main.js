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
import { Demo11_Rasterization } from './demos/Demo11_Rasterization.js'
import { Demo12_GPUArchitecture } from './demos/Demo12_GPUArchitecture.js'
import { Demo13_MultiplayerSync } from './demos/Demo13_MultiplayerSync.js'


const workbenchContainer = document.getElementById('workbench-container');
const slidesContainer = document.getElementById('slides-container');
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
    'lod': Demo10_LOD,
    'rasterization-detail': Demo11_Rasterization,
    'gpu-architecture': Demo12_GPUArchitecture,
    'distributed': Demo13_MultiplayerSync
};


const deck = new Reveal({
  embedded: true,
  // Dimensions par défaut flexibles
  width: 960,
  height: 700,
  margin: 0.1,
  minScale: 0.2,
  maxScale: 2.0,
  
  controls: true,
  progress: true,
  slideNumber: 'c/t',
  hash: true,
  transition: 'slide',
  backgroundTransition: 'fade',
  disableLayout: false,
  center: true, // Centrage vertical actif
  mouseWheel: true
});

// Observer pour redimensionner Reveal.js quand le conteneur change
const slidesResizeObserver = new ResizeObserver(() => {
  deck.layout();
});
slidesResizeObserver.observe(slidesContainer);

deck.on('slidechanged', (event) => {
    updateSlide(event.currentSlide);
});

function updateSlide(slide) {
    const demoId = slide.dataset.demo;
    
    if (demoId && demos[demoId]) {
        workbenchContainer.style.display = 'block';
        workbenchContainer.style.flex = '1';
        slidesContainer.style.flex = '1';
        
        const isSameDemo = workbench.currentDemo instanceof demos[demoId];
        if (!isSameDemo) {
            workbench.loadDemo(new demos[demoId](workbench.renderer));
        }
    } else {
        workbench.disposeCurrent();
        workbenchContainer.style.display = 'none';
        workbenchContainer.style.flex = '0';
        slidesContainer.style.flex = '1';
    }

    if (slide.dataset.stage && workbench.currentDemo && workbench.currentDemo.setStage) {
        workbench.currentDemo.setStage(slide.dataset.stage);
    }
    
    // Forcer un layout immédiat
    deck.layout();
}

deck.initialize().then(() => {
    updateSlide(deck.getCurrentSlide());
});
