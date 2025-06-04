/*
    
    MOMENTUM

    requires hershey fonts .ttf 
    https://github.com/yangcht/Hershey_font_TTF

*/

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const text = "MOMENTUM";
const radius = 75;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
var speed_base = 0.01;
var speed = speed_base;
var decay = null;  // Reduce speed to base value
var decay_duration = 5000;  // Two seconds
var decay_timeout = null;
var flipProgress = 0;
var isFlipping = false;
var isFlipped = false;  // Track if we're currently flipped
var totalRotation = Math.PI / 2;  // Track total rotation
var isPaused = false;  // New variable to track pause state
var originalIndex = null;  // Track the starting index before arrow keys

ctx.font = radius * 0.9 + 'px hershey';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = "white"; 

function draw_text() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Apply flip transform
  ctx.save();
  ctx.translate(centerX, centerY);
  if (isFlipping) {
    // Create 3D flip effect with direction
    const scaleX = isFlipped ? 
      -Math.cos(flipProgress * Math.PI) : // Flipping back
      Math.cos(flipProgress * Math.PI);   // Flipping forward
    ctx.scale(scaleX, 1);
  } else if (isFlipped) {
    // Stay flipped
    ctx.scale(-1, 1);
  }
  ctx.translate(-centerX, -centerY);
  
  // Draw the circular text
  const angleIncrement = (Math.PI * 2) / text.length;
  for (let i = 0; i < text.length; i++) {
    const angle = i * angleIncrement + totalRotation;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(0, -radius);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  
  ctx.restore();

  // Decay speed to base rate   ** in progress **
  if (decay) {        
    const elapsed = performance.now() - decay;
    if (elapsed < decay_duration) {
      const t = elapsed / decay_duration; // Normalized time (0 to 1)
      speed = speed * (1 - t) + speed_base * t; // Linear interpolation
      // console.log('** start decay t --> ' + t + ' speed --> ' + speed + ' **');
    } else {            
      speed = speed_base; // Ensure it reaches the base speed
      decay = null;
    }
  }
    
  // Only update rotation if not paused
  if (!isPaused) {
    // Update rotation based on direction
    totalRotation += (isFlipped ? -speed : speed);
  }
  
  // Update flip animation
  if (isFlipping) {
    flipProgress += 0.05;
    if (flipProgress >= 1) {
      isFlipping = false;
      flipProgress = 0;
      isFlipped = !isFlipped;
      isPaused = isFlipped;  // Pause when flipped, resume when not
      onFlip(isFlipped);  // Call the new handler
    }
  }

  requestAnimationFrame(draw_text);
}

draw_text();

// Add click handler for flip
canvas.addEventListener('click', function() {
  if (!isFlipping) {
    isFlipping = true;
    flipProgress = 0;
    // Call onFlip immediately with the future state
    onFlip(!isFlipped);
  }
});

// Keep existing keyboard controls
document.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {    
    // Store original index if this is the first arrow press
    if (originalIndex === null) {
      originalIndex = slideshow.currentIndex;
    }
    
    if (event.key === 'ArrowLeft') {
      speed -= 0.025;
      slideshow.shuttle(-1);
    } else {
      speed += 0.025;
      slideshow.shuttle(1);
    }
    
    decay = null;
    clearTimeout(decay_timeout);        
    decay_timeout = setTimeout(() => {
      decay = performance.now(); 
      speed *= -1;
      // Return to original index instead of determining current slide
      slideshow.currentIndex = originalIndex;
      slideshow.showSlide(originalIndex);
      originalIndex = null;  // Reset the original index
    }, 2000);
  }
});

function onFlip(isFlipped) {
  // Tell the slideshow about the flip
  const overlay = document.getElementById('overlay');
  // const about = document.getElementById('about');
  // const schedule = document.getElementById('schedule');
  // if (about && schedule) {
  if (overlay) {
    overlay.style.opacity = isFlipped ? '0.9' : '0';
    overlay.style.pointerEvents = isFlipped ? 'auto' : 'none';
    /*
    about.style.opacity = isFlipped ? '0.9' : '0';
    about.style.pointerEvents = isFlipped ? 'auto' : 'none';
    schedule.style.opacity = isFlipped ? '0.9' : '0';
    schedule.style.pointerEvents = isFlipped ? 'auto' : 'none';
    */
    /*
    // Scroll to current item when showing schedule
    if (isFlipped) {
      const currentItem = schedule.querySelector('.item.current');
      if (currentItem) {
        requestAnimationFrame(() => {
          currentItem.scrollIntoView({ 
            behavior: 'auto',
            block: 'center',
            inline: 'center'
          });
        });
      }
    }
    */
  }
}




