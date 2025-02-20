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
var speed = 0.01;
var flipProgress = 0;
var isFlipping = false;
var isFlipped = false;  // Track if we're currently flipped
var totalRotation = Math.PI / 2;  // Track total rotation
var isPaused = false;  // New variable to track pause state

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
  if (event.key === 'ArrowLeft') 
    speed -= 0.025;
  if (event.key === 'ArrowRight')
    speed += 0.025;
});

function onFlip(isFlipped) {
  // Tell the slideshow about the flip
  const grid = document.getElementById('schedule-grid');
  const info = document.getElementById('schedule-info');
  if (grid && info) {
    grid.style.opacity = isFlipped ? '0.9' : '0';
    grid.style.pointerEvents = isFlipped ? 'auto' : 'none';
    info.style.opacity = isFlipped ? '0.9' : '0';
    info.style.pointerEvents = isFlipped ? 'auto' : 'none';
    
    // Scroll to current item when showing grid
    if (isFlipped) {
      const currentItem = grid.querySelector('.item.current');
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
  }
}




