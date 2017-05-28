import {bindable, inject, DOM, PLATFORM} from 'aurelia-framework';

@inject(DOM.Element, PLATFORM.global)
export class ResizerCustomAttribute {
  @bindable orientation?: string;
  @bindable top?: string;
  @bindable left?: string;
  @bindable right?: string;
  @bindable bottom?: string;
  @bindable max?: string;
  @bindable min?: string;
  @bindable width?: string;
  @bindable height?: string;
  @bindable moveWithParent?: string;

  private numMax?: number;
  private numMin?: number;
  private numWidth?: number;
  private numHeight?: number;

  private resizerLeft: HTMLElement;
  private resizerRight: HTMLElement;
  private resizerTop: HTMLElement;
  private resizerBottom: HTMLElement;

  constructor(private element: HTMLElement, private window: Window) {
  }

  bind() {
    if (this.min) {
      this.numMin = +this.min;
    }
    if (this.max) {
      this.numMax = +this.max;
    }
    if (this.width) {
      this.numWidth = +this.width;
    }
    if (this.height) {
      this.numHeight = +this.height;
    }
  }

  attached() {
    if (this.left) {
      this.resizerLeft = <HTMLElement>this.window.document.querySelector(this.left);
    }
    if (this.right) {
      this.resizerRight = <HTMLElement>this.window.document.querySelector(this.right);
    }
    if (this.top) {
      this.resizerTop = <HTMLElement>this.window.document.querySelector(this.top);
    }
    if (this.bottom) {
      this.resizerBottom = <HTMLElement>this.window.document.querySelector(this.bottom);
    }

    this.element.addEventListener('mousedown', this.mouseDownEventHandler.bind(this));
  }

  private mouseDownEventHandler(event: MouseEvent) {
    event.preventDefault();

    this.window.document.addEventListener('mousemove', this.mouseMoveEventHandler.bind(this));
    this.window.document.addEventListener('mouseup', this.mouseUpEventHandler.bind(this));
  }

  private mouseMoveEventHandler(event: MouseEvent) {
    if (this.orientation == 'vertical') {
      // Handle vertical resizer
      let x = event.pageX;

      if (this.min && x < this.numMin) {
        x = this.numMin;
      }
      if (this.max && x > this.numMax) {
        x = this.numMax;
      }

      if (this.moveWithParent) {
        this.element.style.left = `${x}px`;
      }

      if (this.resizerLeft) {
        this.resizerLeft.style.width = `${x}px`;
      }
      if (this.resizerRight) {
        this.resizerRight.style.left = `${x + this.numWidth}px`;
      }
    } else {
      // Handle horizontal resizer
      const y = this.window.innerHeight - event.pageY;

      if (this.moveWithParent) {
        this.element.style.bottom = `${y}px`;
      }

      if (this.resizerTop) {
        this.resizerTop.style.bottom = `${y + this.numHeight}px`;
      }
      if (this.resizerBottom) {
        this.resizerBottom.style.height = `${y}px`;
      }
    }
  }

  private mouseUpEventHandler() {
    this.window.document.addEventListener('mousemove', this.mouseMoveEventHandler.bind(this));
    this.window.document.addEventListener('mouseup', this.mouseUpEventHandler.bind(this));
  }

  detached() {
    this.window.document.addEventListener('mousedown', this.mouseDownEventHandler.bind(this));
    this.window.document.addEventListener('mousemove', this.mouseMoveEventHandler.bind(this));
    this.window.document.addEventListener('mouseup', this.mouseUpEventHandler.bind(this));
  }
}
