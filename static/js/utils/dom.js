export class DOM {
  static createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Add children
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    
    return element;
  }

  static scrollToTop(element) {
    window.scrollTo(0, 0);
    element.scrollTo(0, 0);
console.log('** DOM.scrollToTop() called **');
  }

  static scrollToHideToolbariOS(element) {
    window.scrollTo(0, 400);
    element.scrollTo(0, 400);
console.log('** DOM.scrollToHideToolbariOS() called **');
  }

  static scrollIntoView(element, options = { behavior: 'smooth', block: 'center' }) {
    if (element) {
      element.scrollIntoView(options);
    }
  }

  static getElement(id) {
    return document.getElementById(id);
  }

  static setDisplay(element, display) {
    if (element) {
      element.style.display = display;
    }
  }

  static setOpacity(element, opacity) {
    if (element) {
      element.style.opacity = opacity;
    }
  }

  static setPointerEvents(element, value) {
    if (element) {
      element.style.pointerEvents = value;
    }
  }

  static addClass(element, className) {
    if (element) {
      element.classList.add(className);
    }
  }

  static removeClass(element, className) {
    if (element) {
      element.classList.remove(className);
    }
  }

  static hasClass(element, className) {
    return element && element.classList.contains(className);
  }

  static setText(element, text) {
    if (element) {
      element.textContent = text;
    }
  }

  static appendChild(parent, child) {
    if (parent && child) {
      parent.appendChild(child);
    }
  }

  static removeChild(parent, child) {
    if (parent && child) {
      parent.removeChild(child);
    }
  }

  static querySelector(parent, selector) {
    return parent ? parent.querySelector(selector) : null;
  }

  static querySelectorAll(parent, selector) {
    return parent ? Array.from(parent.querySelectorAll(selector)) : [];
  }
} 
