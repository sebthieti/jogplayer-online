import {customAttribute, bindable, autoinject} from 'aurelia-framework';

@autoinject
export class HideParentOnClickCustomAttribute {
  @bindable showText: string;
  @bindable hideText: string;

  private parent: HTMLElement;
  private isParentHidden: boolean;

  constructor(private element: Element) {
    this.parent = element.parentElement;
  }

  attached() {
    this.element.addEventListener('click', this.hideParentOnClick.bind(this));
  }

  detached() {
    this.element.removeEventListener('click', this.hideParentOnClick.bind(this));
  }

  private hideParentOnClick() {
    if (!this.isParentHidden) {
      this.parent.style.left = `${-this.parent.clientWidth}px`;
      if (this.showText) {
        this.element.textContent = this.showText;
      }
    } else {
      this.parent.style.left = '0';
      if (this.hideText) {
        this.element.textContent = this.hideText;
      }
    }

    this.isParentHidden = !this.isParentHidden;
  }
}
