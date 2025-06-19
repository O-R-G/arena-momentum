import { DOM } from '../utils/dom.js';

export class Overlay {
  constructor() {
    this.overlay = DOM.getElement('overlay');
    this.about = DOM.getElement('about');
    this.schedule = DOM.getElement('schedule');
    this.colophon = DOM.getElement('colophon');
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
} 
