import * as THREE from 'three';
import GUI from 'lil-gui';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export class Demo12_GPUArchitecture {
    constructor(renderer) {
        this.renderer = renderer;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.1;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(55, 1, 1, 20000);
        this.camera.position.set(30, 30, 100);

        this.currentStage = 'shader';
        this.clock = new THREE.Clock();

        const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
        this.water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg', function(t) {
                    t.wrapS = t.wrapT = THREE.RepeatWrapping;
                }),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 8.0,
                size: 2.0,
                fog: false
            }
        );
        this.water.rotation.x = -Math.PI / 2;

        this.sky = new Sky();
        this.sky.scale.setScalar(10000);

        const skyUniforms = this.sky.material.uniforms;
        skyUniforms['turbidity'].value = 10;
        skyUniforms['rayleigh'].value = 2;
        skyUniforms['mieCoefficient'].value = 0.005;
        skyUniforms['mieDirectionalG'].value = 0.8;

        this.sun = new THREE.Vector3();
        this.skyParams = {
            elevation: 0,
            azimuth: 180
        };

        this.pmremGenerator = new THREE.PMREMGenerator(renderer);
        this.updateSun();

        this.composer = new EffectComposer(renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.bloomPass.threshold = 0;
        this.bloomPass.strength = 0.2;
        this.bloomPass.radius = 0.5;
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(new OutputPass());

        const pointsCount = 10000;
        const positions = new Float32Array(pointsCount * 3);
        for (let i = 0; i < pointsCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
        const pointsGeom = new THREE.BufferGeometry();
        pointsGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.points = new THREE.Points(pointsGeom, new THREE.PointsMaterial({ size: 0.2, color: 0x00ffff }));

        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        this.params = {
            stage: 'shader',
            useGLSL: true,
            info: 'Mer Agitée (Architecture GPU)'
        };

        this.gui.add(this.params, 'stage', ['parallel', 'vram', 'shader']).name('Mode').onChange(v => this.setStage(v));
        
        const oceanFolder = this.gui.addFolder('Contrôle Ocean/Ciel');
        oceanFolder.add(this.params, 'useGLSL').name('Activer Shaders').onChange(v => this.toggleShader(v));
        oceanFolder.add(this.water.material.uniforms.distortionScale, 'value', 0, 20, 0.1).name('Agitation');
        oceanFolder.open();

        this.infoCtrl = this.gui.add(this.params, 'info').name('Status').disable();

        this.setStage('shader');
    }

    updateSun() {
        const phi = THREE.MathUtils.degToRad(90 - this.skyParams.elevation);
        const theta = THREE.MathUtils.degToRad(this.skyParams.azimuth);
        this.sun.setFromSphericalCoords(1, phi, theta);

        this.sky.material.uniforms['sunPosition'].value.copy(this.sun);
        this.water.material.uniforms['sunDirection'].value.copy(this.sun).normalize();

        const sceneEnv = new THREE.Scene();
        sceneEnv.add(this.sky);
        const envTarget = this.pmremGenerator.fromScene(sceneEnv);
        
        this.scene.add(this.sky);
        this.scene.environment = envTarget.texture;
        
        this.renderer.toneMappingExposure = 0.5;
    }

    toggleShader(enabled) {
        if (this.currentStage !== 'shader') return;
        this.water.visible = enabled;
        this.sky.visible = enabled;
        this.params.info = enabled ? "Mer Déchaînée (Calcul GPU)" : "Surface Plane (Pas de Shaders)";
        this.infoCtrl.updateDisplay();
    }

    setStage(stage) {
        this.currentStage = stage;
        this.scene.clear();
        this.scene.environment = null;
        
        this.camera.lookAt(0, 0, 0);
        
        if (stage === 'parallel') {
            this.scene.add(this.points);
            this.camera.position.set(0, 0, 100);
            this.camera.lookAt(0, 0, 0);
            this.renderer.toneMappingExposure = 1.0;
            this.params.info = '10,000 particules simultanées';
        } else if (stage === 'vram') {
            this.setupVramDemo();
            this.camera.position.set(0, 0, 120); 
            this.camera.lookAt(0, 0, 0);
            this.renderer.toneMappingExposure = 1.0;
            this.params.info = '1,000 Draw Calls (Surcharge CPU)';
        } else if (stage === 'shader') {
            this.scene.add(this.water);
            this.scene.add(this.sky);
            this.camera.position.set(30, 30, 100);
            this.updateSun();
            this.toggleShader(this.params.useGLSL);
        }
        this.infoCtrl.updateDisplay();
    }

    setupVramDemo() {
        const geom = new THREE.BoxGeometry(2, 2, 2);
        for (let i = 0; i < 1000; i++) {
            const mesh = new THREE.Mesh(geom, new THREE.MeshNormalMaterial());
            mesh.position.set((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100);
            this.scene.add(mesh);
        }
    }

    update() {
        if (this.currentStage === 'shader' && this.params.useGLSL) {
            this.water.material.uniforms['time'].value += 2.0 / 60.0; 
        } else if (this.currentStage === 'parallel') {
            this.points.rotation.y += 0.002;
        } else if (this.currentStage === 'vram') {
            this.scene.traverse(o => { if(o.isMesh) o.rotation.x += 0.01; });
        }
    }

    render(renderer) {
        if (this.currentStage === 'shader') {
            this.composer.render();
        } else {
            renderer.render(this.scene, this.camera);
        }
    }

    onResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.composer.setSize(width, height);
    }

    dispose() {
        this.gui.destroy();
        this.pmremGenerator.dispose();
    }
}
