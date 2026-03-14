import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo6_Camera {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        // Main Observer Camera
        this.mainCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.mainCamera.position.set(10, 5, 10);
        this.mainCamera.lookAt(0, 0, 0);

        // Simulated Virtual Camera
        this.virtualCamera = new THREE.PerspectiveCamera(40, 1.6, 2, 10);
        this.virtualCamera.position.set(0, 0, 5);
        this.virtualCamera.lookAt(0, 0, -5);
        this.virtualCamera.updateProjectionMatrix();

        // Frustum Helper
        this.cameraHelper = new THREE.CameraHelper(this.virtualCamera);
        this.scene.add(this.cameraHelper);

        // Camera mesh representation
        const camGeom = new THREE.BoxGeometry(0.5, 0.5, 1);
        const camMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        this.virtualCamMesh = new THREE.Mesh(camGeom, camMat);
        this.virtualCamMesh.position.copy(this.virtualCamera.position);
        this.virtualCamMesh.quaternion.copy(this.virtualCamera.quaternion);
        this.scene.add(this.virtualCamMesh);

        // Near Plane Visualization (Render-to-Texture)
        this.renderTarget = new THREE.WebGLRenderTarget(512, 512);
        
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
        this.bufferPlane.position.set(0, 0, -near); 
        this.virtualCamMesh.add(this.bufferPlane);

        // Scene objects
        this.targetGroup = new THREE.Group();
        this.scene.add(this.targetGroup);

        const grid = new THREE.GridHelper(20, 20);
        this.scene.add(grid);

        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const matA = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const matB = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const matC = new THREE.MeshStandardMaterial({ color: 0x0000ff });

        const cubeA = new THREE.Mesh(boxGeo, matA); cubeA.position.set(0, 0.5, 0);
        const cubeB = new THREE.Mesh(boxGeo, matB); cubeB.position.set(2, 0.5, -2);
        const cubeC = new THREE.Mesh(boxGeo, matC); cubeC.position.set(-2, 0.5, -2);
        this.targetGroup.add(cubeA, cubeB, cubeC);

        // Lighting
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 5);
        this.scene.add(dirLight);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

        // GUI
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

        this.gui.add(params, 'fov', 10, 90).name('FOV').onChange(v => {
            this.virtualCamera.fov = v;
            this.virtualCamera.updateProjectionMatrix();
            this.cameraHelper.update();
            this.updateBufferPlaneSize();
        });

        this.gui.add(params, 'near', 0.1, 5).name('Near Plane').onChange(v => {
            this.virtualCamera.near = v;
            this.virtualCamera.updateProjectionMatrix();
            this.cameraHelper.update();
            this.updateBufferPlaneSize();
        });

        this.gui.add(params, 'far', 5, 20).name('Far Plane').onChange(v => {
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
    }

    render(renderer) {
        // Render from Virtual Camera to Texture
        this.cameraHelper.visible = false;
        this.virtualCamMesh.visible = false;
        
        const originalBg = this.scene.background;
        this.scene.background = new THREE.Color(0x000000);

        renderer.setRenderTarget(this.renderTarget);
        renderer.render(this.scene, this.virtualCamera);
        renderer.setRenderTarget(null);

        this.scene.background = originalBg;
        this.cameraHelper.visible = true;
        this.virtualCamMesh.visible = true;

        // Main Render
        renderer.render(this.scene, this.mainCamera);
    }

    onResize(width, height) {
        this.mainCamera.aspect = width / height;
        this.mainCamera.updateProjectionMatrix();
    }

    dispose() {
        this.gui.destroy();
        this.renderTarget.dispose();
        
        this.scene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
    }
}
