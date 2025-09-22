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

// Global functions for debugging and performance monitoring
window.slideshow_debug = function() {
  if (window.slideshow) {
    window.slideshow.enableDebugMode();
  }
}

window.slideshow_stats = function() {
  if (window.slideshow) {
    const stats = window.slideshow.getPerformanceStats();
    console.log('Current Slideshow Stats:', stats);
    return stats;
  }
}

window.slideshow_cleanup = function() {
  if (window.slideshow) {
    window.slideshow.forceCleanup();
  }
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
      
      // Check if we're on a direct route and pause the logo animation
      if (this.overlay.isOnDirectRoute()) {
        this.animation.isPaused = true;
        // Note: slideshow continues running on schedule in background
      }
      
      // Resync time periodically
      setInterval(() => this.time.syncTime(), 60000);
    } catch (error) {
      console.error('Failed to initialize application:', error);
    }
  }
}

// Create global app instance
window.app = new App(); 