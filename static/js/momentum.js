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
// var speed = 1.01;            // accelerate
ctx.font = radius * 0.9 + 'px hershey';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = "white"; 
let angleOffset = Math.PI / 2;

function draw_text() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const angleIncrement = (Math.PI * 2) / text.length;
  for (let i = 0; i < text.length; i++) {
    const angle = i * angleIncrement + angleOffset;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(0, -radius);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  angleOffset += speed;
  // angleOffset *= speed;      // accelerate
  requestAnimationFrame(draw_text);
}
draw_text();

document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowLeft') 
        speed -= 0.025;
    if (event.key === 'ArrowRight')
        speed += 0.025;
});




