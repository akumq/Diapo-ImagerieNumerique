import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo5_SceneGraph {
    constructor(renderer) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 1, 0);

        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(2, 5, 2);
        this.scene.add(dirLight);

        this.base = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.2, 1),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        this.scene.add(this.base);

        this.shoulder = new THREE.Group();
        this.shoulder.position.y = 0.1;
        this.base.add(this.shoulder);

        const shoulderMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        shoulderMesh.position.y = 0.25;
        this.shoulder.add(shoulderMesh);

        this.armPivot = new THREE.Group();
        this.armPivot.position.y = 0.5;
        this.shoulder.add(this.armPivot);

        const upperArmMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 1.5, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x00ff00 })
        );
        upperArmMesh.position.y = 0.75;
        this.armPivot.add(upperArmMesh);

        this.elbowPivot = new THREE.Group();
        this.elbowPivot.position.y = 1.5;
        this.armPivot.add(this.elbowPivot);

        const elbowJoint = new THREE.Mesh(
            new THREE.SphereGeometry(0.3),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        this.elbowPivot.add(elbowJoint);

        const forearmMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 1.2, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x0000ff })
        );
        forearmMesh.position.y = 0.6;
        this.elbowPivot.add(forearmMesh);

        const grid = new THREE.GridHelper(10, 10, 0xffffff, 0xaaaaaa);
        this.scene.add(grid);

        const container = document.getElementById('workbench-container');
        this.gui = new GUI({ container: container });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        const params = {
            baseRot: 0,
            shoulderRot: 0,
            elbowRot: 0
        };

        this.gui.add(params, 'baseRot', -180, 180).name('Rotation Base').onChange(v => {
            this.shoulder.rotation.y = THREE.MathUtils.degToRad(v);
        });
        
        this.gui.add(params, 'shoulderRot', -45, 90).name('Épaule (Levage)').onChange(v => {
            this.armPivot.rotation.z = THREE.MathUtils.degToRad(v);
        });

        this.gui.add(params, 'elbowRot', -90, 90).name('Coude').onChange(v => {
            this.elbowPivot.rotation.z = THREE.MathUtils.degToRad(v);
        });
    }

    update() {
        // Animation or updates
    }

    render(renderer) {
        renderer.render(this.scene, this.camera);
    }

    onResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    dispose() {
        this.gui.destroy();
        this.scene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
    }
}
