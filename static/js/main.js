import { Overlay } from './modules/overlay.js';
import { Animation } from './modules/animation.js';
import { Time } from './utils/time.js';
import { Slideshow } from './modules/slideshow.js';
import { DOM } from './utils/dom.js';

// Global functions for HTML onclick handlers
window.overlay_show = function(id) {
  window.app.overlay.show(id);
}

window.overlay_hide = function(id) {
  window.app.overlay.hide(id);
}

class App {
  constructor() {
    this.overlay = new Overlay();
    this.animation = new Animation('canvas');
    this.time = new Time();
    
    // Set up animation callback
    this.animation.setOnFlipCallback((isFlipped) => {
      this.overlay.setVisibility(isFlipped);
    });
    
    // Initialize when page loads
    window.addEventListener('load', () => this.init());
  }

  async init() {
    try {
      await this.time.syncTime();
      // Initialize slideshow
      window.slideshow = new Slideshow();
      await window.slideshow.init();
      
      // Resync time periodically
      setInterval(() => this.time.syncTime(), 60000);
    } catch (error) {
      console.error('Failed to initialize application:', error);
    }
  }
}

// Create global app instance
window.app = new App(); 