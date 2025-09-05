import { DOM } from '../utils/dom.js';

export class Overlay {
  constructor() {
    this.overlay = DOM.getElement('overlay');
    this.about = DOM.getElement('about');
    this.schedule = DOM.getElement('schedule');
    this.colophon = DOM.getElement('colophon');
    
    // Check if we're on a direct route from the start
    const path = window.location.pathname;
    const directRoutes = ['/about', '/schedule', '/colophon'];
    this.isOnDirectRouteFlag = directRoutes.some(route => path === route || path === route + '/');
    
    console.log('Overlay constructor - direct route flag set to:', this.isOnDirectRouteFlag, 'for path:', path);
    this.init();
  }

  init() {
    DOM.scrollToHideToolbariOS(this.overlay);
  }

  show(id) {
    // First hide all sections and scroll to top
    DOM.setDisplay(this.about, 'none');
    DOM.setDisplay(this.schedule, 'none');
    DOM.setDisplay(this.colophon, 'none');
    DOM.scrollToTop(DOM.getElement('overlay'));
    
    // Then show the requested section
    const element = DOM.getElement(id);
    if (element) {
      DOM.setDisplay(element, 'block');
      element.style.opacity = '1';
      
      // Create schedule grid when showing schedule
      if (id === 'schedule' && window.slideshow) {
        window.slideshow.createScheduleGrid();
      }
    }    
  }

  hide(id) {
    // Scroll to top, show #about, then hide id
    DOM.scrollToTop(DOM.getElement('overlay'));
    DOM.setDisplay(this.about, 'block');
    DOM.setDisplay(DOM.getElement(id), 'none');
  }

  setVisibility(isVisible) {
    console.log('setVisibility called with:', isVisible);
    if (isVisible) {
      console.trace('setVisibility(true) call stack:');
    }
    if (isVisible) {
      DOM.setDisplay(this.colophon, 'none');
      DOM.setDisplay(this.schedule, 'none');
      DOM.setDisplay(this.about, 'block');
      DOM.setOpacity(this.overlay, '0.9');
      DOM.setPointerEvents(this.overlay, 'auto');
    } else {
      DOM.setOpacity(this.overlay, '0');
      DOM.setPointerEvents(this.overlay, 'none');
    }
  }

  // Method to check if we're on a direct route
  isOnDirectRoute() {
    return this.isOnDirectRouteFlag;
  }
  
  // Method to set direct route state
  setDirectRouteState(isDirect) {
    this.isOnDirectRouteFlag = isDirect;
    console.log('Direct route state set to:', isDirect);
  }

  // Method to return to slideshow from direct route
  returnToSlideshow() {
    console.log('=== returnToSlideshow called ===');
    if (this.isOnDirectRoute()) {
      // Clear direct route state first
      this.setDirectRouteState(false);
      
      // Update URL to root without page reload
      window.history.pushState({}, '', '/');
      
      // Resume animation
      if (window.app && window.app.animation) {
        window.app.animation.isPaused = false;
      }
      
      // Force hide the overlay immediately
      this.setVisibility(false);
    }
    console.log('=== returnToSlideshow complete ===');
  }
} 
