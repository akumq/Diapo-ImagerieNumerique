import * as THREE from 'three';

export class CubeDemo {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); // Aspects fixed on resize
        this.camera.position.z = 5;

        this.cube = null;
    }

    init() {
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
    }

    update() {
        if (this.cube) {
            this.cube.rotation.x += 0.01;
            this.cube.rotation.y += 0.01;
        }
    }

    render(renderer) {
        renderer.render(this.scene, this.camera);
    }

    onResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    dispose() {
        // Cleanup geometries/materials
        if (this.cube) {
            this.cube.geometry.dispose();
            this.cube.material.dispose();
        }
    }
}
