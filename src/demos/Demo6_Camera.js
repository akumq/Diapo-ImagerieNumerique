import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo6_Camera {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        // --- Main Observer Camera (The one WE look through) ---
        this.mainCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.mainCamera.position.set(10, 5, 10);
        this.mainCamera.lookAt(0, 0, 0);

        // --- The Virtual Camera (The one we are Simulating/Explain) ---
        this.virtualCamera = new THREE.PerspectiveCamera(40, 1.6, 2, 10);
        this.virtualCamera.position.set(0, 0, 5);
        this.virtualCamera.lookAt(0, 0, -5);
        this.virtualCamera.updateProjectionMatrix();

        // Helper to visualize the Frustum
        this.cameraHelper = new THREE.CameraHelper(this.virtualCamera);
        this.scene.add(this.cameraHelper);

        // Virtual Camera Material (Visual representation of the camera object)
        const camGeom = new THREE.BoxGeometry(0.5, 0.5, 1);
        const camMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        this.virtualCamMesh = new THREE.Mesh(camGeom, camMat);
        this.virtualCamMesh.position.copy(this.virtualCamera.position);
        this.virtualCamMesh.quaternion.copy(this.virtualCamera.quaternion);
        this.scene.add(this.virtualCamMesh);

        // --- Image Buffer (Near Plane Visualization) ---
        // We will render what the Virtual Camera sees into a texture
        this.renderTarget = new THREE.WebGLRenderTarget(512, 512);
        
        // The Near Plane Quad
        // Perspective near plane size: 
        // height = 2 * near * tan(fov / 2)
        // width = height * aspect
        const near = this.virtualCamera.near;
        const fov = THREE.MathUtils.degToRad(this.virtualCamera.fov);
        const height = 2 * near * Math.tan(fov / 2);
        const width = height * this.virtualCamera.aspect;

        this.bufferPlaneGeometry = new THREE.PlaneGeometry(width, height);
        this.bufferMaterial = new THREE.MeshBasicMaterial({ 
            map: this.renderTarget.texture,
            side: THREE.DoubleSide
        });
        this.bufferPlane = new THREE.Mesh(this.bufferPlaneGeometry, this.bufferMaterial);
        
        // Position the buffer plane exactly at the near plane of the virtual camera
        this.bufferPlane.position.set(0, 0, -near); 
        this.virtualCamMesh.add(this.bufferPlane); // Attach to camera mesh so it moves with it

        // --- The World Scene (Target Objects) ---
        this.targetGroup = new THREE.Group();
        this.scene.add(this.targetGroup);

        const grid = new THREE.GridHelper(20, 20);
        this.scene.add(grid); // Add grid to root scene so it's always visible? Or to target group? Root is fine.

        // Add some colorful cubes to look at
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const matA = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const matB = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const matC = new THREE.MeshStandardMaterial({ color: 0x0000ff });

        const cubeA = new THREE.Mesh(boxGeo, matA); cubeA.position.set(0, 0.5, 0);
        const cubeB = new THREE.Mesh(boxGeo, matB); cubeB.position.set(2, 0.5, -2);
        const cubeC = new THREE.Mesh(boxGeo, matC); cubeC.position.set(-2, 0.5, -2);
        this.targetGroup.add(cubeA, cubeB, cubeC);

        // Ambient Scene Lights
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 5);
        this.scene.add(dirLight);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

        // --- GUI ---
        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        const params = {
            fov: 40,
            near: 2,
            far: 10,
            rotateTarget: true
        };
        this.params = params;

        this.gui.add(params, 'fov', 10, 90).name('FOV (Champ de vision)').onChange(v => {
            this.virtualCamera.fov = v;
            this.virtualCamera.updateProjectionMatrix();
            this.cameraHelper.update();
            this.updateBufferPlaneSize();
        });

        this.gui.add(params, 'near', 0.1, 5).name('Plan Proche (Near)').onChange(v => {
            this.virtualCamera.near = v;
            this.virtualCamera.updateProjectionMatrix();
            this.cameraHelper.update();
            this.updateBufferPlaneSize();
        });

        this.gui.add(params, 'far', 5, 20).name('Plan Lointain (Far)').onChange(v => {
            this.virtualCamera.far = v;
            this.virtualCamera.updateProjectionMatrix();
            this.cameraHelper.update();
        });
        
        this.gui.add(params, 'rotateTarget').name('Rotation Cible');
    }

    updateBufferPlaneSize() {
        const near = this.virtualCamera.near;
        const fov = THREE.MathUtils.degToRad(this.virtualCamera.fov);
        const height = 2 * near * Math.tan(fov / 2);
        const width = height * this.virtualCamera.aspect;

        this.bufferPlane.geometry.dispose();
        this.bufferPlane.geometry = new THREE.PlaneGeometry(width, height);
        this.bufferPlane.position.set(0, 0, -near);
    }

    update() {
        if (this.params.rotateTarget) {
            this.targetGroup.rotation.y += 0.005;
        }

        // Make the main camera orbit slowly or just look? 
        // Let's keep main camera static to provide a steady "workbench" view,
        // but maybe allow simple orbit controls if we had them. 
        // For now static is clear for the diagram concept.
    }

    render(renderer) {
        // 1. Render from Virtual Camera to Texture (Buffer)
        // Hide helper and buffer plane from the virtual camera view
        this.cameraHelper.visible = false;
        this.virtualCamMesh.visible = false; // Hides the cam mesh AND the attached buffer plane
        
        // We need the background to be black or specific for the "internal" view
        const originalBg = this.scene.background;
        this.scene.background = new THREE.Color(0x000000);

        renderer.setRenderTarget(this.renderTarget);
        renderer.render(this.scene, this.virtualCamera);
        renderer.setRenderTarget(null);

        // Restore visibility and background
        this.scene.background = originalBg;
        this.cameraHelper.visible = true;
        this.virtualCamMesh.visible = true;

        // 2. Render Main Scene to Screen
        renderer.render(this.scene, this.mainCamera);
    }

    onResize(width, height) {
        // Main camera resize
        this.mainCamera.aspect = width / height;
        this.mainCamera.updateProjectionMatrix();

        // Virtual camera aspect resize? 
        // Maybe we want to keep the virtual camera fixed aspect to show the "Sensor" shape typically being 16:9 or 3:2.
        // But for simplicity let's match aspect ratio or fix it to 1.6 (roughly 16:10).
        // this.virtualCamera.aspect = width / height; 
        // this.virtualCamera.updateProjectionMatrix();
        // this.updateBufferPlaneSize();
    }

    dispose() {
        this.gui.destroy();
        this.renderTarget.dispose();
        this.bufferPlaneGeometry.dispose();
        // ... dispose others
    }
}
