import {autoinject, DOM} from 'aurelia-framework';

@autoinject(DOM.Element)
export class StopEventCustomAttribute {
  constructor(private element: Element) {
  }

  attached() {
    this.element.addEventListener('click', this.stopPropagation.bind(this));
  }

  detached() {
    this.element.removeEventListener('click', this.stopPropagation.bind(this));
  }

  private stopPropagation(event: Event) {
    event.stopPropagation();
  }
}
