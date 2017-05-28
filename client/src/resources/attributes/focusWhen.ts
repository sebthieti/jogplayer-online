import {inject, DOM} from 'aurelia-framework';

@inject(DOM.Element)
export class FocusWhenCustomAttribute {
  constructor(private element: HTMLElement) {
  }

  valueChanged(newValue: boolean, oldValue: boolean) {
    if (newValue === true) {
      this.element.focus();
    }
  }
}
