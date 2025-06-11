import { DOM } from '../utils/dom.js';

export class Animation {
  constructor(canvasId, text = "MOMENTUM") {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.text = text;
    this.radius = 75;
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    
    // Animation state
    this.speed_base = 0.01;
    this.speed = this.speed_base;
    this.decay = null;
    this.decay_duration = 5000;
    this.decay_timeout = null;
    this.flipProgress = 0;
    this.isFlipping = false;
    this.isFlipped = false;
    this.totalRotation = Math.PI / 2;
    this.isPaused = false;
    this.originalIndex = null;

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
      const angle = i * angleIncrement + this.totalRotation;
      this.ctx.save();
      this.ctx.translate(this.centerX, this.centerY);
      this.ctx.rotate(angle);
      this.ctx.translate(0, -this.radius);
      this.ctx.rotate(-Math.PI / 2);
      this.ctx.fillText(this.text[i], 0, 0);
      this.ctx.restore();
    }
    
    this.ctx.restore();

    // Handle speed decay
    if (this.decay) {        
      const elapsed = performance.now() - this.decay;
      if (elapsed < this.decay_duration) {
        const t = elapsed / this.decay_duration;
        this.speed = this.speed * (1 - t) + this.speed_base * t;
      } else {            
        this.speed = this.speed_base;
        this.decay = null;
      }
    }
    
    // Update rotation if not paused
    if (!this.isPaused) {
      this.totalRotation += (this.isFlipped ? -this.speed : this.speed);
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
        this.speed -= 0.025;
        window.slideshow.shuttle(-1);
      } else {
        this.speed += 0.025;
        window.slideshow.shuttle(1);
      }
      
      this.decay = null;
      clearTimeout(this.decay_timeout);        
      this.decay_timeout = setTimeout(() => {
        this.decay = performance.now(); 
        this.speed *= -1;
        window.slideshow.currentIndex = this.originalIndex;
        window.slideshow.showSlide(this.originalIndex);
        this.originalIndex = null;
      }, 2000);
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