import {inject, DOM} from 'aurelia-framework';

@inject(DOM.Element)
export class EnterCustomAttribute {
  enterEventCallback: (event: Event) => void;

  private enterKeyCode = 13;

  constructor(private element: Element) {
  }

  valueChanged(newValue: (event: Event) => void) {
    this.enterEventCallback = newValue;
  }

  attached() {
    this.element.addEventListener('keypress', this.enterEventHandler.bind(this));
  }

  detached() {
    this.element.removeEventListener('keypress', this.enterEventHandler.bind(this));
  }

  private enterEventHandler(event: KeyboardEvent) {
    if (event.which === this.enterKeyCode) {
      this.enterEventCallback(event);
      event.preventDefault();
    }
  }
}
