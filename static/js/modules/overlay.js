import { DOM } from '../utils/dom.js';

export class Overlay {
  constructor() {
    this.overlay = DOM.getElement('overlay');
    this.about = DOM.getElement('about');
    this.schedule = DOM.getElement('schedule');
    this.colophon = DOM.getElement('colophon');
  }

  show(id) {
    // First hide all sections
    DOM.setDisplay(this.about, 'none');
    DOM.setDisplay(this.schedule, 'none');
    DOM.setDisplay(this.colophon, 'none');
    
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
    
    DOM.scrollToTop();
  }

  hide(id) {
    DOM.setDisplay(this.about, 'block');
    DOM.setDisplay(DOM.getElement(id), 'none');
    DOM.scrollToTop();
  }

  setVisibility(isVisible) {
    if (this.overlay) {
      DOM.setOpacity(this.overlay, isVisible ? '0.9' : '0');
      DOM.setPointerEvents(this.overlay, isVisible ? 'auto' : 'none');
      
      if (isVisible) {
        // Only hide colophon, keep schedule visible if it's being shown
        DOM.setDisplay(this.colophon, 'none');
        // Only show about if no other section is visible
        if (this.schedule.style.display !== 'block' && this.colophon.style.display !== 'block') {
          DOM.setDisplay(this.about, 'block');
        }
      }
      DOM.scrollToTop();
    }
  }
} 