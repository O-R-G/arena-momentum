/*
    SLIDESHOW
    
    Handles synchronized image display based on daily schedule
*/

class Slideshow {
  constructor() {
    this.schedule = null;
    this.currentIndex = 0;
    this.preloadedImages = new Map();
    this.currentImage = null;
    this.serverTimeOffset = 0;
    this.lastSync = 0;
    this.hasLoggedTimes = false;
  }

  async syncTime() {
    try {
      // Make multiple time requests to get more accurate offset
      const offsets = [];
      for (let i = 0; i < 3; i++) {
        const beforeRequest = Date.now() / 1000;
        const response = await fetch('/api/time.php');
        const afterRequest = Date.now() / 1000;
        const serverTime = await response.json();
        
        // Calculate offset accounting for request latency
        const latency = (afterRequest - beforeRequest) / 2;
        const offset = serverTime - (afterRequest - latency);
        offsets.push(offset);
      }
      
      // Use the median offset to avoid outliers
      offsets.sort((a, b) => a - b);
      this.serverTimeOffset = offsets[1];
      this.lastSync = Date.now() / 1000;
      
      console.log('Time synced, offset:', this.serverTimeOffset);
    } catch (error) {
      console.error('Failed to sync time:', error);
    }
  }

  async init() {
    try {
      await this.syncTime();
      const response = await fetch('/api/data/schedule.json');
      this.schedule = await response.json();
      
      // Create schedule grid
      this.createScheduleGrid();
      
      // Start the slideshow
      this.determineCurrentSlide();
      this.preloadUpcoming();
      this.startTimer();
      
      // Resync time periodically
      setInterval(() => this.syncTime(), 60000); // Every minute
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  }

  determineCurrentSlide() {
    const now = this.getCurrentTime();
    const schedule = this.schedule.schedule;
    console.log('Current time:', now);
    console.log('First slide time:', schedule[0].timestamp);
    
    // If we're past the last slide of the day, adjust current time to be relative to first slide
    if (now > schedule[schedule.length - 1].timestamp) {
      const dayDuration = schedule[schedule.length - 1].timestamp - schedule[0].timestamp;
      const timeIntoSchedule = (now - schedule[0].timestamp) % dayDuration;
      const adjustedTime = schedule[0].timestamp + timeIntoSchedule;
      console.log('Adjusted time:', adjustedTime);
      
      // Find the appropriate slide for the adjusted time
      let found = false;
      for (let i = 0; i < schedule.length; i++) {
        if (schedule[i].timestamp > adjustedTime) {
          this.currentIndex = Math.max(0, i - 1);
          found = true;
          console.log('Selected slide index (adjusted):', this.currentIndex);
          break;
        }
      }
      
      // If no slide found, show first slide
      if (!found) {
        this.currentIndex = 0;
        console.log('No slide found, showing first slide');
      }
    } else {
      // Normal case - find the next slide
      let found = false;
      for (let i = 0; i < schedule.length; i++) {
        if (schedule[i].timestamp > now) {
          this.currentIndex = Math.max(0, i - 1);
          found = true;
          console.log('Selected slide index:', this.currentIndex);
          break;
        }
      }
      
      // If no slide found, show first slide
      if (!found) {
        this.currentIndex = 0;
        console.log('No slide found, showing first slide');
      }
    }
    
    // Force immediate display of first slide
    this.showSlide(this.currentIndex).catch(error => {
      console.error('Failed to show initial slide:', error);
      // Try showing first slide as fallback
      this.showSlide(0);
    });
  }

  async preloadUpcoming() {
    const schedule = this.schedule.schedule;
    const preloadCount = this.schedule.metadata.preload_count || 3;
    
    // Preload next few images
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = (this.currentIndex + i) % schedule.length;
      this.preloadImage(schedule[nextIndex].block.image_url);
    }
  }

  async preloadImage(url) {
    if (!this.preloadedImages.has(url)) {
      const img = new Image();
      img.src = url;
      this.preloadedImages.set(url, img);
    }
  }

  async showSlide(index) {
    const schedule = this.schedule.schedule;
    const slide = schedule[index];
    const url = slide.block.image_url;
    
    console.log('Showing slide:', index, 'URL:', url);
    
    // Create container if it doesn't exist
    if (!this.container) {
      console.log('Creating container');
      this.container = document.createElement('div');
      this.container.id = 'slideshow';
      this.container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 0;
        background: black;
        overflow: hidden;
        cursor: pointer;
      `;
      
      // Add click handler to container
      this.container.addEventListener('click', () => {
        const currentSlide = this.schedule.schedule[this.currentIndex];
        const blockUrl = `https://www.are.na/block/${currentSlide.block.id}`;
        window.open(blockUrl, '_blank');
      });
      
      document.body.insertBefore(this.container, document.body.firstChild);
    }

    // Create new image element
    const newImage = new Image();
    newImage.className = 'slide';
    
    try {
      // Load the image first
      await new Promise((resolve, reject) => {
        newImage.onload = resolve;
        newImage.onerror = reject;
        newImage.src = url;
      });
      
      // Add new image to container
      this.container.appendChild(newImage);
      
      // Force a reflow
      newImage.offsetHeight;
      
      // Make new image active
      requestAnimationFrame(() => {
        // If there's a current image, mark it as previous
        if (this.currentImage) {
          this.currentImage.classList.remove('active');
          this.currentImage.classList.add('previous');
          
          // Remove old previous slides
          Array.from(this.container.querySelectorAll('.previous')).forEach(slide => {
            if (slide !== this.currentImage) {
              this.container.removeChild(slide);
            }
          });
        }
        
        // Activate new image
        newImage.classList.add('active');
        this.currentImage = newImage;
      });
      
      console.log('Now showing:', slide.block.title, 'from', slide.block.channel_title);
      
      // Update schedule grid to reflect current slide
      this.updateScheduleGrid();
      
      // Scroll current slide into view if grid is visible
      const grid = document.getElementById('schedule-grid');
      const currentItem = grid.querySelector('.item.current');
      if (currentItem && grid.style.opacity === '1') {
        currentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (error) {
      console.error('Error loading image:', error);
    }
  }

  startTimer() {
    let lastIndex = this.currentIndex;
    
    const tick = () => {
      const now = this.getCurrentTime();
      const schedule = this.schedule.schedule;
      const startTime = schedule[0].timestamp;
      const duration = this.schedule.metadata.slide_duration;
      const totalDuration = schedule.length * duration;
      
      // Calculate which slide should be showing based on elapsed time
      const elapsedTime = (now - startTime) % totalDuration;
      const slideIndex = Math.floor(elapsedTime / duration);
      
      // Add detailed logging
      if (slideIndex !== lastIndex) {
        console.log('Slide change debug:', {
          currentTime: new Date(now * 1000).toLocaleTimeString(),
          startTime: new Date(startTime * 1000).toLocaleTimeString(),
          elapsedSeconds: Math.floor(elapsedTime),
          duration,
          oldIndex: lastIndex,
          newIndex: slideIndex,
          serverOffset: this.serverTimeOffset
        });
        
        lastIndex = slideIndex;
        this.currentIndex = slideIndex;
        this.showSlide(this.currentIndex);
        this.preloadUpcoming();
      }
      
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  getCurrentTime() {
    const now = Date.now() / 1000;
    return now + this.serverTimeOffset;
  }

  createScheduleGrid() {
    // Just populate the schedule
    this.updateScheduleGrid();
  }
  
  updateScheduleGrid() {
    const grid = document.getElementById('schedule-grid');
    const schedule = this.schedule.schedule;
    
    grid.innerHTML = schedule.map((slide, index) => {
      const isCurrent = index === this.currentIndex;
      const isPast = index < this.currentIndex;
      const className = `item ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}`;
      
      return `
        <div class="${className}">
          <div class="title">${slide.block.title || 'Untitled'}</div>
          <div class="channel">${slide.block.channel_title}</div>
        </div>
      `;
    }).join('');

    // Scroll to current item horizontally
    const currentItem = grid.querySelector('.item.current');
    if (currentItem && grid.style.opacity === '1') {
      // Calculate which column the current item is in
      const itemBounds = currentItem.getBoundingClientRect();
      const gridBounds = grid.getBoundingClientRect();
      const columnWidth = 300 + 40; // column width + gap
      const targetColumn = Math.floor(itemBounds.left / columnWidth);
      
      grid.scrollTo({
        left: targetColumn * columnWidth,
        behavior: 'smooth'
      });
    }
  }
}

// Initialize when page loads
window.addEventListener('load', () => {
  const slideshow = new Slideshow();
  slideshow.init();
}); 
