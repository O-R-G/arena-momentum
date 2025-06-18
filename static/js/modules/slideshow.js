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
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  async init() {
    try {
      // Show loading state
      this.showLoadingState();
      
      // Wait for stable time sync
      await this.time.waitForStableSync();
      // console.log('Time sync state:', this.time.getSyncState());
      
      this.time.startPeriodicSync();
      this.time.calculateServerToLocalOffset();
      
      const response = await fetch('/api/data/schedule.json');
      this.schedule = await response.json();
      
      // Create container first
      if (!this.container) {
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

        // Add touch event handlers
        this.container.addEventListener('touchstart', (e) => {
          this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.container.addEventListener('touchend', (e) => {
          this.touchEndX = e.changedTouches[0].screenX;
          this.handleSwipe();
        }, { passive: true });
        
        document.body.insertBefore(this.container, document.body.firstChild);
      }

      // Remove loading state
      this.hideLoadingState();
      
      // Wait a bit to ensure time sync is really stable
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Double check time sync is still stable
      if (!this.time.getSyncState().isStable) {
        await this.time.waitForStableSync();
      }
      
      // Show first slide and wait for it to complete
      await this.determineCurrentSlide();
      
      // Only start preloading and timer after first slide is shown
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

  getAdjustedTime() {
    const now = this.time.getCurrentTime();
    const schedule = this.schedule.schedule;
    const startTime = schedule[0].timestamp;
    const duration = this.schedule.metadata.slide_duration;
    const totalDuration = schedule.length * duration;
    
    // Calculate the current time position within the schedule cycle
    const elapsedTime = (now - startTime) % totalDuration;
    const adjustedTime = startTime + elapsedTime;
    return adjustedTime;
  }

  getSlideTimestampAdjusted(index) {
    const schedule = this.schedule.schedule;
    const startTime = schedule[0].timestamp;
    const duration = this.schedule.metadata.slide_duration;
    // Calculate the timestamp for this slide index using the same logic as startTimer
    const slideTimestamp = startTime + (index * duration);
    return slideTimestamp;
  }

  convertScheduleTimestampToLocalTime(timestamp) {
    return timestamp - this.time.serverToLocalOffset;
  }

  determineCurrentSlide() {
    const now = this.getAdjustedTime();
    const schedule = this.schedule.schedule;
    
    // If we're past the last slide of the day, adjust current time to be relative to first slide
    if (now > schedule[schedule.length - 1].timestamp) {
      // console.log('Adjusted time:', adjustedTime);
      
      // Find the appropriate slide for the adjusted time
      let found = false;
      for (let i = 0; i < schedule.length; i++) {
        if (schedule[i].timestamp > adjustedTime) {
          this.currentIndex = Math.max(0, i - 1);
          found = true;
          // console.log('Selected slide index (adjusted):', this.currentIndex);
          break;
        }
      }
      
      // If no slide found, show first slide
      if (!found) {
        this.currentIndex = 0;
        // console.log('No slide found, showing first slide');
      }
    } else {
      // Normal case - find the next slide
      let found = false;
      for (let i = 0; i < schedule.length; i++) {
        if (schedule[i].timestamp > now) {
          this.currentIndex = Math.max(0, i - 1);
          found = true;
          // console.log('Selected slide index:', this.currentIndex);
          break;
        }
      }
      
      // If no slide found, show first slide
      if (!found) {
        this.currentIndex = 0;
        // console.log('No slide found, showing first slide');
      }
    }
    
    // Force immediate display of first slide
    return this.showSlide(this.currentIndex).catch(error => {
      console.error('Failed to show initial slide:', error);
      // Try showing first slide as fallback
      return this.showSlide(0);
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
        await this.preloadImage(slide);
      } else if (slide.block.type === 'Media') {
        await this.preloadVideo(slide);
      } else if (slide.block.type === 'Attachment') {
        // Preload attachment video
        await this.preloadAttachmentVideo(slide);
      }
    }
  }

  async preloadImage(slide) {
    // Use local file if available, otherwise fall back to remote URL
    const imageUrl = slide.local_file || slide.block.image_url;
    
    if (!this.preloadedImages.has(imageUrl)) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.preloadedImages.set(imageUrl, img);
          resolve();
        };
        img.onerror = reject;
        img.src = imageUrl;
      });
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
        
        // Wait for video to be ready and start playing
        await new Promise((resolve, reject) => {
          video.addEventListener('loadedmetadata', () => {
            console.log('Preloaded video metadata loaded, attempting to play');
            video.play().then(() => {
              console.log('Preloaded video started playing successfully');
              resolve();
            }).catch(e => {
              console.error('Error autoplaying preloaded video:', e);
              reject(e);
            });
          });
          
          video.addEventListener('error', (e) => {
            console.error('Error loading preloaded video:', e);
            reject(e);
          });
        });
        
        this.preloadedVideos.set(slide.block.id, wrapper);
        
        // Add to DOM but keep hidden
        this.container.appendChild(wrapper);
      } else if (slide.block.vimeo_url) {
        const iframe = DOM.createElement('iframe', {
          width: '100vw',
          height: '100vh',
          frameborder: '0',
          allow: 'autoplay; fullscreen',
          allowfullscreen: ''
        });
        
        const vimeoUrl = slide.block.vimeo_url;
        console.log('Preloading Vimeo URL:', vimeoUrl);
        
        // Add Vimeo-specific parameters for autoplay
        const params = 'background=1&autoplay=1&muted=1&controls=0&loop=1';
        const src = vimeoUrl.includes('?') ? `${vimeoUrl}&${params}` : `${vimeoUrl}?${params}`;
        iframe.setAttribute('src', src);
        
        wrapper.appendChild(iframe);
        this.preloadedVideos.set(slide.block.id, wrapper);
        
        // Add to DOM but keep hidden
        this.container.appendChild(wrapper);
      } else {
        throw new Error('No media source found for slide');
      }
    }
  }

  async preloadAttachmentVideo(slide) {
    if (slide.block.video_url) {
      console.log('Using attachment video:', slide.block.video_url);
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
        src: slide.block.video_url,
        type: slide.block.content_type || 'video/mp4'
      });
      video.appendChild(source);
      
      // Add event listeners for video
      await new Promise((resolve, reject) => {
        video.addEventListener('loadedmetadata', () => {
          console.log('Video metadata loaded, attempting to play');
          video.play().then(() => {
            console.log('Video started playing successfully');
            resolve();
          }).catch(e => {
            console.error('Error autoplaying video:', e);
            reject(e);
          });
        });
        
        video.addEventListener('error', (e) => {
          console.error('Error loading video:', e);
          reject(e);
        });
      });
      
      const wrapper = DOM.createElement('div', { className: 'slide' });
      wrapper.appendChild(video);
      
      // Add to DOM but keep hidden
      this.container.appendChild(wrapper);
    } else {
      throw new Error('No video URL found for attachment');
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
      // DO NOT REMOVE ALL SLIDES HERE
      // this.currentImage will be the old slide, if any
      if (type === 'Image') {
        newElement = new Image();
        newElement.className = 'slide';
        
        // Use local file if available, otherwise fall back to remote URL
        const imageUrl = slide.local_file || slide.block.image_url;
        
        // Load the image first
        await new Promise((resolve, reject) => {
          newElement.onload = resolve;
          newElement.onerror = reject;
          newElement.src = imageUrl;
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
            await new Promise((resolve, reject) => {
              video.addEventListener('loadedmetadata', () => {
                console.log('Video metadata loaded, attempting to play');
                video.play().then(() => {
                  console.log('Video started playing successfully');
                  resolve();
                }).catch(e => {
                  console.error('Error autoplaying video:', e);
                  reject(e);
                });
              });
              
              video.addEventListener('error', (e) => {
                console.error('Error loading video:', e);
                reject(e);
              });
            });
            
            newElement.appendChild(video);
          } else if (slide.block.vimeo_url) {
            const iframe = DOM.createElement('iframe', {
              width: '100vw',
              height: '100vh',
              frameborder: '0',
              allow: 'autoplay; fullscreen',
              allowfullscreen: ''
            });
            
            const vimeoUrl = slide.block.vimeo_url;
            console.log('Using Vimeo URL:', vimeoUrl);
            
            // Add Vimeo-specific parameters for autoplay
            const params = 'background=1&autoplay=1&muted=1&controls=0&loop=1';
            const src = vimeoUrl.includes('?') ? `${vimeoUrl}&${params}` : `${vimeoUrl}?${params}`;
            iframe.setAttribute('src', src);
            
            newElement.appendChild(iframe);
          } else {
            throw new Error('No media source found for slide');
          }
        }
      } else if (type === 'Attachment') {
        // Create new video element for attachment
        newElement = DOM.createElement('div', { className: 'slide' });
        
        if (slide.block.video_url) {
          console.log('Using attachment video:', slide.block.video_url);
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
            src: slide.block.video_url,
            type: slide.block.content_type || 'video/mp4'
          });
          video.appendChild(source);
          
          // Add event listeners for video
          await new Promise((resolve, reject) => {
            video.addEventListener('loadedmetadata', () => {
              console.log('Video metadata loaded, attempting to play');
              video.play().then(() => {
                console.log('Video started playing successfully');
                resolve();
              }).catch(e => {
                console.error('Error autoplaying video:', e);
                reject(e);
              });
            });
            
            video.addEventListener('error', (e) => {
              console.error('Error loading video:', e);
              reject(e);
            });
          });
          
          newElement.appendChild(video);
        } else {
          throw new Error('No video URL found for attachment');
        }
      } else {
        throw new Error(`Unsupported slide type: ${type}`);
      }
      
      if (!newElement) {
        throw new Error('Failed to create element');
      }
      
      console.log('Created new element:', newElement);
      
      // Add new element to container
      this.container.appendChild(newElement);
      
      // Force a reflow
      newElement.offsetHeight;
      
      // Make new element active
      requestAnimationFrame(() => {
        // Save reference to the old slide
        const oldSlide = this.currentImage;
        if (oldSlide) {
          oldSlide.classList.remove('active');
          oldSlide.classList.add('previous');
          // Remove old slide after fade
          setTimeout(() => {
            if (oldSlide.parentNode) oldSlide.remove();
          }, 1000); // Match this with your CSS transition duration
        }
        // Activate new element
        newElement.classList.add('active');
        this.currentImage = newElement;
      });
      
      // Update channel and image info
      this.showChannelInfo(index);
      
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
      
      // If we failed to show the slide, try showing the first slide as fallback
      if (index !== 0) {
        console.log('Attempting to show first slide as fallback');
        return this.showSlide(0);
      }
      
      // If we're already trying to show the first slide and it failed,
      // create a simple error message element
      newElement = DOM.createElement('div', {
        className: 'slide error',
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          textAlign: 'center',
          padding: '20px'
        }
      });
      newElement.textContent = 'Failed to load slide. Please refresh the page.';
      
      this.container.appendChild(newElement);
      newElement.classList.add('active');
      this.currentImage = newElement;
    }
  }

  startTimer() {
    let lastIndex = this.currentIndex;

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

      this.showChannelInfo(slideIndex);
      
      // Force resync if time difference is too large
      if (Math.abs(this.time.getTimeDifference()) > 1000) {
        this.time.syncTime().then(() => {
          this.time.lastSyncTime = now;
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

  showChannelInfo(index) {
    const schedule = this.schedule.schedule;
    const slide = schedule[index];
    const channel_info = document.getElementById('channel-info');
    const timestamp = this.time.getCurrentTime();
    const formattedTimestamp = new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    channel_info.textContent = formattedTimestamp + ' : ' + slide.block.title;
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
      const title = slide.block.title || 'Untitled';
      // Convert unix timestamp to local time
      const adjustedTimestamp = this.convertScheduleTimestampToLocalTime(slide.timestamp);
      const timestamp = new Date(adjustedTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      const combinedTitle = timestamp + ' : ' + title;
      console.log(combinedTitle);
      return `
        <div class="item">
          ${combinedTitle}
        </div>
      `;
    }).join('');

    // Initial class update
    this.updateScheduleGrid();
  }

  // Adjust slideshow playhead 
  async shuttle(direction) {
    if (direction === 'prev') {
      this.currentIndex = Math.max(0, this.currentIndex - 1);
    } else if (direction === 'next') {
      this.currentIndex = (this.currentIndex + 1) % this.schedule.schedule.length;
    } else {
      this.currentIndex += direction;
    }
    await this.showSlide(this.currentIndex);
  }

  handleSwipe() {
    const swipeThreshold = 50; // Minimum distance for a swipe
    const swipeDistance = this.touchEndX - this.touchStartX;
    
    console.log('Swipe detected:', {
      startX: this.touchStartX,
      endX: this.touchEndX,
      distance: swipeDistance,
      threshold: swipeThreshold
    });
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        // Swipe right - go to previous slide
        console.log('Swiping right - going to previous slide');
        this.shuttle('prev');
      } else {
        // Swipe left - go to next slide
        console.log('Swiping left - going to next slide');
        this.shuttle('next');
      }
    }
  }
} 