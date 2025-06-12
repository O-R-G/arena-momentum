import { Time } from '../utils/time.js';
import { DOM } from '../utils/dom.js';

export class Slideshow {
  constructor() {
    this.schedule = null;
    this.currentIndex = 0;
    this.preloadedImages = new Map();
    this.preloadedVideos = new Map();
    this.currentImage = null;
    this.time = new Time();
    this.isPaused = false;
    this.lastSlideChange = 0;
    this.isInitialized = false;
    this.debugMode = true; // Enable debug mode
  }

  async init() {
    try {
      // Show loading state
      this.showLoadingState();
      
      // Wait for stable time sync
      await this.time.waitForStableSync();
      console.log('Time sync state:', this.time.getSyncState());
      
      this.time.startPeriodicSync();
      
      const response = await fetch('/api/data/schedule.json');
      this.schedule = await response.json();
      
      // Create container first
      if (!this.container) {
        console.log('Creating container');
        this.container = DOM.createElement('div', {
          id: 'slideshow',
          style: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
            background: 'black',
            overflow: 'hidden',
            cursor: 'pointer'
          }
        });
        
        // Add click handler to container
        this.container.addEventListener('click', () => {
          const currentSlide = this.schedule.schedule[this.currentIndex];
          const blockUrl = `https://www.are.na/block/${currentSlide.block.id}`;
          window.open(blockUrl, '_blank');
        });
        
        document.body.insertBefore(this.container, document.body.firstChild);
      }

      // Remove loading state
      this.hideLoadingState();
      
      this.determineCurrentSlide();
      this.preloadUpcoming();
      this.startTimer();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize slideshow:', error);
      this.showErrorState(error);
    }
  }

  showLoadingState() {
    const loading = DOM.createElement('div', {
      id: 'loading',
      style: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        fontSize: '24px',
        zIndex: 1000
      }
    }, ['Synchronizing time...']);
    
    document.body.appendChild(loading);
  }

  hideLoadingState() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.remove();
    }
  }

  showErrorState(error) {
    const errorDiv = DOM.createElement('div', {
      id: 'error',
      style: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'red',
        fontSize: '24px',
        zIndex: 1000,
        textAlign: 'center'
      }
    }, [
      'Failed to initialize slideshow',
      DOM.createElement('div', {
        style: {
          fontSize: '16px',
          marginTop: '10px'
        }
      }, [error.message])
    ]);
    
    document.body.appendChild(errorDiv);
  }

  determineCurrentSlide() {
    const now = this.time.getCurrentTime();
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
    
    // Preload next few slides
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = (this.currentIndex + i) % schedule.length;
      const slide = schedule[nextIndex];
      
      if (slide.block.type === 'Image') {
        this.preloadImage(slide.block.image_url);
      } else if (slide.block.type === 'Media') {
        this.preloadVideo(slide);
      }
    }
  }

  async preloadImage(url) {
    if (!this.preloadedImages.has(url)) {
      const img = new Image();
      img.src = url;
      this.preloadedImages.set(url, img);
    }
  }

  async preloadVideo(slide) {
    if (!this.preloadedVideos.has(slide.block.id)) {
      const wrapper = DOM.createElement('div', {
        className: 'slide preloading',
        style: { display: 'none' }
      });
      
      // Only handle local video files
      if (slide.local_file) {
        const video = DOM.createElement('video', {
          width: '100%',
          height: '100%',
          playsinline: '',
          muted: '',
          autoplay: '',
          loop: '',
          'webkit-playsinline': '',
          'x5-playsinline': '',
          style: { objectFit: 'cover' }
        });
        
        const source = DOM.createElement('source', {
          src: slide.local_file,
          type: 'video/mp4'
        });
        video.appendChild(source);
        wrapper.appendChild(video);
        this.preloadedVideos.set(slide.block.id, wrapper);
        
        // Add to DOM but keep hidden
        this.container.appendChild(wrapper);
      }
    }
  }

  async showSlide(index) {
    const schedule = this.schedule.schedule;
    const slide = schedule[index];
    const type = slide.block.type;
    
    console.log('Showing slide:', index, 'Type:', type);
    
    // Create or get slide element based on type
    let newElement;
    
    try {
      if (type === 'Image') {
        newElement = new Image();
        newElement.className = 'slide';
        
        // Load the image first
        await new Promise((resolve, reject) => {
          newElement.onload = resolve;
          newElement.onerror = reject;
          newElement.src = slide.block.image_url;
        });
      } else if (type === 'Media') {
        // Check if we have a preloaded video
        if (this.preloadedVideos.has(slide.block.id)) {
          newElement = this.preloadedVideos.get(slide.block.id);
          newElement.style.display = '';  // Make visible
          this.preloadedVideos.delete(slide.block.id);  // Remove from preloaded map
        } else {
          // Create new video element if not preloaded
          newElement = DOM.createElement('div', { className: 'slide' });
          
          // Check if we have a local file
          if (slide.local_file) {
            console.log('Using local file:', slide.local_file);
            const video = DOM.createElement('video', {
              width: '100%',
              height: '100%',
              playsinline: '',
              muted: '',
              autoplay: '',
              loop: '',
              'webkit-playsinline': '',
              'x5-playsinline': '',
              style: { objectFit: 'cover' }
            });
            
            // Set the source
            const source = DOM.createElement('source', {
              src: slide.local_file,
              type: 'video/mp4'
            });
            video.appendChild(source);
            
            // Add event listeners for video
            video.addEventListener('loadedmetadata', () => {
              console.log('Video metadata loaded, attempting to play');
              video.play().then(() => {
                console.log('Video started playing successfully');
              }).catch(e => {
                console.error('Error autoplaying video:', e);
                // Try playing again after a short delay
                setTimeout(() => {
                  video.play().catch(e => console.error('Error on second play attempt:', e));
                }, 100);
              });
            });
            
            video.addEventListener('canplay', () => {
              console.log('Video can play');
            });
            
            video.addEventListener('playing', () => {
              console.log('Video is playing');
            });
            
            // Error handling
            video.addEventListener('error', (e) => {
              console.error('Error loading video:', e);
              console.error('Video error code:', video.error.code);
              console.error('Video error message:', video.error.message);
              newElement.textContent = 'Video unavailable';
            });
            
            newElement.appendChild(video);
          } else {
            const iframe = DOM.createElement('iframe', {
              width: '100%',
              height: '100%',
              frameborder: '0',
              allow: 'autoplay; fullscreen'
            });
            
            const embedHtml = slide.block.embed_html;
            if (embedHtml) {
              const srcMatch = embedHtml.match(/src="([^"]+)"/);
              
              if (srcMatch && srcMatch[1]) {
                let src = srcMatch[1];
                // Add Vimeo-specific parameters for autoplay
                src = src.includes('?') ? src + '&' : src + '?';
                src += 'autoplay=1&background=1&muted=1&loop=1&byline=0&title=0&controls=0';
                iframe.setAttribute('src', src);
              }
            } else if (slide.block.source_url) {
              // Handle Vimeo URLs
              const vimeoMatch = slide.block.source_url.match(/vimeo\.com\/(\d+)/);
              if (vimeoMatch) {
                const videoId = vimeoMatch[1];
                const src = `https://player.vimeo.com/video/${videoId}?autoplay=1&background=1&muted=1&loop=1&byline=0&title=0&controls=0`;
                iframe.setAttribute('src', src);
              } else {
                // Handle other video URLs
                iframe.setAttribute('src', slide.block.source_url);
              }
            }
            
            newElement.appendChild(iframe);
          }
        }
      } else if (type === 'Attachment') {
        // Create a wrapper div for the video
        newElement = DOM.createElement('div', { className: 'slide' });
        
        // Create video element
        const video = DOM.createElement('video', {
          width: '100%',
          height: '100%',
          playsinline: '',
          muted: '',
          autoplay: '',
          loop: '',
          style: { objectFit: 'cover' }
        });
        
        // Set the source
        const source = DOM.createElement('source', {
          src: slide.block.video_url,
          type: slide.block.content_type
        });
        video.appendChild(source);
        
        // Add event listeners for video
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(e => console.error('Error autoplaying video:', e));
        });
        
        // Error handling
        video.addEventListener('error', (e) => {
          console.error('Error loading video:', e);
          newElement.textContent = 'Video unavailable';
        });
        
        // Append the video to our wrapper
        newElement.appendChild(video);
      }
      
      console.log('Created new element:', newElement);
      
      if (!newElement) {
        throw new Error('Failed to create element');
      }
      
      // Add new element to container
      this.container.appendChild(newElement);
      
      // Force a reflow
      newElement.offsetHeight;
      
      // Make new element active
      requestAnimationFrame(() => {
        // If there's a current element, mark it as previous
        if (this.currentImage) {
          this.currentImage.classList.remove('active');
          this.currentImage.classList.add('previous');
          
          // Remove old previous slides after a delay to ensure smooth transition
          setTimeout(() => {
            Array.from(this.container.querySelectorAll('.previous')).forEach(slide => {
              if (slide !== this.currentImage) {
                slide.remove();
              }
            });
          }, 1000); // Match this with your CSS transition duration
        }
        
        // Activate new element
        newElement.classList.add('active');
        this.currentImage = newElement;
      });
      
      // Update channel and image info
      const channel_info = document.getElementById('channel-info');
      channel_info.textContent = slide.block.channel_title + ' : ' + slide.block.title;
      console.log('Now showing:', slide.block.title, 'from', slide.block.channel_title);
      
      // Update schedule grid to reflect current slide
      this.updateScheduleGrid();
      
      // Scroll current slide into view if grid is visible
      const grid = document.getElementById('schedule-grid');
      const currentItem = grid.querySelector('.item.current');
      if (currentItem && grid.style.opacity === '1') {
        DOM.scrollIntoView(currentItem);
      }
    } catch (error) {
      console.error('Error in showSlide:', error);
      console.log('Problematic slide:', slide);
    }
  }

  startTimer() {
    let lastIndex = this.currentIndex;
    let lastDebugTime = 0;
    let lastSyncTime = 0;
    
    const tick = () => {
      if (!this.isInitialized || this.isPaused) {
        requestAnimationFrame(tick);
        return;
      }

      const now = this.time.getCurrentTime();
      const schedule = this.schedule.schedule;
      const startTime = schedule[0].timestamp;
      const duration = this.schedule.metadata.slide_duration;
      const totalDuration = schedule.length * duration;
      
      // Calculate which slide should be showing based on elapsed time
      const elapsedTime = (now - startTime) % totalDuration;
      const slideIndex = Math.floor(elapsedTime / duration);
      
      // Force resync if time difference is too large
      if (Math.abs(this.time.getTimeDifference()) > 1000) {
        this.time.syncTime().then(() => {
          lastSyncTime = now;
        });
      }
      
      if (slideIndex !== lastIndex) {
        lastIndex = slideIndex;
        this.currentIndex = slideIndex;
        this.lastSlideChange = now;
        this.showSlide(this.currentIndex);
        this.preloadUpcoming();
      }
      
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  // Add method to reset timer state
  resetTimer() {
    this.isPaused = false;
    // Force a re-evaluation of the current slide
    this.determineCurrentSlide();
  }

  updateScheduleGrid() {
    const grid = document.getElementById('schedule-grid');
    if (!grid) {
      console.log('Schedule grid not found, skipping update');
      return;
    }

    const schedule = this.schedule.schedule;
    if (!schedule) {
      console.log('No schedule data available');
      return;
    }

    // Update classes for all items
    const items = grid.querySelectorAll('.item');
    items.forEach((item, index) => {
      const isCurrent = index === this.currentIndex;
      const isPast = index < this.currentIndex;
      
      item.classList.toggle('current', isCurrent);
      item.classList.toggle('past', isPast);
    });

    // Scroll to current item
    const currentItem = grid.querySelector('.current');
    if (currentItem) {
      DOM.scrollIntoView(currentItem, { behavior: 'smooth', block: 'center' });
    }
  }

  createScheduleGrid() {
    console.log('Creating schedule grid');
    const grid = document.getElementById('schedule-grid');
    if (!grid || !this.schedule) return;

    const schedule = this.schedule.schedule;
    grid.innerHTML = schedule.map((slide, index) => {
      return `
        <div class="item">
          <div class="title">${slide.block.title || 'Untitled'}</div>
          <div class="channel">${slide.block.channel_title || 'Untitled Channel'}</div>
        </div>
      `;
    }).join('');

    // Initial class update
    this.updateScheduleGrid();
  }

  // Adjust slideshow playhead 
  async shuttle(direction) {
    this.currentIndex += direction;
    this.showSlide(this.currentIndex);
  }
} 