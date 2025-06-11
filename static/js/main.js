import { Overlay } from './modules/overlay.js';
import { Animation } from './modules/animation.js';
import { Time } from './utils/time.js';
import { Slideshow } from './modules/slideshow.js';
import { DOM } from './utils/dom.js';

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

// Start the application
new App(); 