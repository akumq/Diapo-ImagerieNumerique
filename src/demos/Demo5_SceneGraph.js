import * as THREE from 'three';
import GUI from 'lil-gui';

export class Demo5_SceneGraph {
    constructor(renderer) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 1, 0);

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(2, 5, 2);
        this.scene.add(dirLight);

        // Robot Arm Hierarchy
        // Base
        this.base = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.2, 1),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        this.scene.add(this.base);

        // Shoulder (Child of Base)
        this.shoulder = new THREE.Group();
        this.shoulder.position.y = 0.1; // On top of base
        this.base.add(this.shoulder);

        // Shoulder Mesh
        const shoulderMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        shoulderMesh.position.y = 0.25;
        this.shoulder.add(shoulderMesh);

        // Upper Arm Pivot (Shoulder Joint)
        this.armPivot = new THREE.Group();
        this.armPivot.position.y = 0.5; // Top of shoulder mesh
        this.shoulder.add(this.armPivot);

        // Upper Arm Mesh (Visual)
        const upperArmMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 1.5, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x00ff00 })
        );
        upperArmMesh.position.y = 0.75; // Center of mesh is half-height up from pivot
        this.armPivot.add(upperArmMesh);

        // Elbow Pivot (Child of Upper Arm Pivot)
        this.elbowPivot = new THREE.Group();
        this.elbowPivot.position.y = 1.5; // Top of upper arm
        this.armPivot.add(this.elbowPivot);

        // Elbow Joint Visual
        const elbowJoint = new THREE.Mesh(
            new THREE.SphereGeometry(0.3),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        this.elbowPivot.add(elbowJoint);

        // Forearm Mesh (Child of Elbow Pivot)
        const forearmMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 1.2, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x0000ff })
        );
        forearmMesh.position.y = 0.6; // Half length up from pivot
        this.elbowPivot.add(forearmMesh);

        // Grid
        const grid = new THREE.GridHelper(10, 10);
        this.scene.add(grid);

        // GUI
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
        
        // Shoulder rotates the Arm Pivot (Z axis lift)
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
