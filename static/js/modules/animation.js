import { DOM } from '../utils/dom.js';

export class Animation {
  constructor(canvasId, text = "MOMENTUM") {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.text = text;
    this.radius = 75;
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    
    // Debug flag
    this.debug = false;
    
    // Animation state
    this.speedBase = 0.01;
    this.speed = this.speedBase;
    this.direction = 1; // 1 for clockwise, -1 for counterclockwise
    this.decay = null;
    this.decayDuration = 600; // 1 second for reversal
    this.lastKeyPress = null;
    this.isSpedUp = false;
    this.speedUpDuration = 300; // 300ms for sped-up state
    this.keyPressDuration = 1000; // Reduced to 1s before reversal
    this.flipProgress = 0;
    this.isFlipping = false;
    this.isFlipped = false;
    this.totalRotation = Math.PI / 2;
    this.isPaused = false;
    this.originalIndex = null;
    
    // Windup state
    this.windupCount = 0;
    this.maxWindup = 10;
    this.windupSpeed = 0.025;
    this.isUnwinding = false;
    this.decayDirection = null; // Store original direction during decay

    // Setup canvas
    this.ctx.font = this.radius * 0.9 + 'px hershey';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = "white";

    // Bind methods
    this.draw = this.draw.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);

    // Add event listeners
    this.canvas.addEventListener('click', this.handleClick);
    document.addEventListener('keydown', this.handleKeydown);

    // Start animation
    this.draw();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add a background color that changes with state (only in debug mode)
    if (this.debug) {
      if (this.decay) {
        this.ctx.fillStyle = 'rgba(0,0,255,0.1)'; // Blue for reversal
      } else if (this.isSpedUp) {
        this.ctx.fillStyle = 'rgba(0,255,0,0.2)'; // Green for sped up
      } else {
        this.ctx.fillStyle = 'rgba(200,0,0,0.1)'; // Dark red for normal
      }
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Apply flip transform
    this.ctx.save();
    this.ctx.translate(this.centerX, this.centerY);
    if (this.isFlipping) {
      const scaleX = this.isFlipped ? 
        -Math.cos(this.flipProgress * Math.PI) : 
        Math.cos(this.flipProgress * Math.PI);
      this.ctx.scale(scaleX, 1);
    } else if (this.isFlipped) {
      this.ctx.scale(-1, 1);
    }
    this.ctx.translate(-this.centerX, -this.centerY);
    
    // Draw the circular text
    const angleIncrement = (Math.PI * 2) / this.text.length;
    for (let i = 0; i < this.text.length; i++) {
      // Change how we calculate the angle based on direction
      const angle = this.direction === 1 ? 
        i * angleIncrement + this.totalRotation :
        -i * angleIncrement - this.totalRotation;
      
      this.ctx.save();
      this.ctx.translate(this.centerX, this.centerY);
      this.ctx.rotate(angle);
      this.ctx.translate(0, -this.radius);
      this.ctx.rotate(-Math.PI / 2);

      // Change text color based on state (only in debug mode)
      if (this.debug) {
        if (this.decay) {
          this.ctx.fillStyle = 'blue'; // Blue for reversal
        } else if (this.isSpedUp) {
          this.ctx.fillStyle = '#00ff00'; // Green for sped up
        } else {
          this.ctx.fillStyle = '#cc0000'; // Dark red for normal
        }
      } else {
        this.ctx.fillStyle = 'white';
      }
      this.ctx.fillText(this.text[i], 0, 0);
      this.ctx.restore();
    }
    
    this.ctx.restore();

    // Handle key press timing and reversal
    if (this.lastKeyPress) {
      const now = performance.now();
      const elapsed = now - this.lastKeyPress;
      
      // Check if reversal should start
      if (elapsed >= this.keyPressDuration && !this.decay) {
        this.direction *= -1; // Reverse direction
        this.decay = now;
        this.isSpedUp = false; // Clear sped-up state when reversal starts
        window.slideshow.currentIndex = this.originalIndex;
        window.slideshow.showSlide(this.originalIndex);
        this.originalIndex = null;
      }
    }

    // Handle decay
    if (this.decay) {        
      const elapsed = performance.now() - this.decay;
      if (elapsed < this.decayDuration) {
        const t = elapsed / this.decayDuration; // Normalized time (0 to 1)
        // Keep the speed constant during the reversal phase
        this.speed = Math.abs(this.speed);
      } else {            
        this.speed = this.speedBase;
        this.direction = 1; // Reset to clockwise
        this.decay = null;
        this.lastKeyPress = null;
      }
    }
    
    // Update rotation if not paused
    if (!this.isPaused) {
      this.totalRotation += this.speed;
    }
    
    // Update flip animation
    if (this.isFlipping) {
      this.flipProgress += 0.05;
      if (this.flipProgress >= 1) {
        this.isFlipping = false;
        this.flipProgress = 0;
        this.isFlipped = !this.isFlipped;
        this.isPaused = this.isFlipped;
        this.onFlip(this.isFlipped);
      }
    }

    requestAnimationFrame(this.draw);
  }

  handleClick() {
    if (!this.isFlipping) {
      this.isFlipping = true;
      this.flipProgress = 0;
      this.onFlip(!this.isFlipped);
    }
  }

  handleKeydown(event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {    
      if (this.originalIndex === null) {
        this.originalIndex = window.slideshow.currentIndex;
      }
      
      if (event.key === 'ArrowLeft') {
        this.speed = Math.abs(this.speed) + 0.025;
        this.direction = -1; // Counterclockwise
        window.slideshow.shuttle(-1);
      } else {
        this.speed = Math.abs(this.speed) + 0.025;
        this.direction = 1; // Clockwise
        window.slideshow.shuttle(1);
      }
      
      this.decay = null;
      this.lastKeyPress = performance.now();
      this.isSpedUp = true; // Set sped-up state
    }
  }

  onFlip(isFlipped) {
    // This will be set by the main application
    if (this.onFlipCallback) {
      this.onFlipCallback(isFlipped);
    }
  }

  setOnFlipCallback(callback) {
    this.onFlipCallback = callback;
  }
} 