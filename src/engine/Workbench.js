import * as THREE from 'three';

export class Workbench {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.currentDemo = null;
    this.rafId = null;

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);
  }

  loadDemo(demoInstance) {
    if (this.currentDemo) {
      this.disposeCurrent();
    }
    
    this.currentDemo = demoInstance;
    
    if (this.currentDemo.init) {
        this.currentDemo.init(this.renderer.domElement);
    }

    this.onResize();
    this.startLoop();
  }

  disposeCurrent() {
    this.stopLoop();
    if (this.currentDemo && this.currentDemo.dispose) {
        this.currentDemo.dispose();
    }
    this.currentDemo = null;
    this.renderer.clear();
  }

  startLoop() {
    if (this.rafId) return;
    this.loop();
  }

  stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  loop() {
    this.rafId = requestAnimationFrame(() => this.loop());
    if (this.currentDemo) {
        this.currentDemo.update();
        this.currentDemo.render(this.renderer);
    }
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.renderer.setSize(width, height);
    if (this.currentDemo && this.currentDemo.onResize) {
        this.currentDemo.onResize(width, height);
    }
  }
}
