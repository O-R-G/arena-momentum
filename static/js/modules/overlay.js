import { DOM } from '../utils/dom.js';

export class Overlay {
  constructor() {
    this.overlay = DOM.getElement('overlay');
    this.about = DOM.getElement('about');
    this.schedule = DOM.getElement('schedule');
    this.colophon = DOM.getElement('colophon');
  }

  show(id) {
    DOM.setDisplay(this.about, 'none');
    DOM.setDisplay(DOM.getElement(id), 'block');
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
        DOM.setDisplay(this.schedule, 'none');
        DOM.setDisplay(this.colophon, 'none');
        DOM.setDisplay(this.about, 'block');
      }
      DOM.scrollToTop();
    }
  }
} 