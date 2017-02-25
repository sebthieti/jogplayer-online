export interface IColorSettings {
  normalColor: string;
  playColor: string;
  invalidColor: string;
  cutColor: string;

  normalFont: string;
  playFont: string;
  invalidFont: string;
  cutFont: string;
}

export default class ColorSettings implements IColorSettings {
  normalColor: string;
  playColor: string;
  invalidColor: string;
  cutColor: string;
  normalFont: string;
  playFont: string;
  invalidFont: string;
  cutFont: string;

  constructor(entity: IColorSettings) {
    this.normalColor = entity.normalColor;
    this.playColor = entity.playColor;
    this.invalidColor = entity.invalidColor;
    this.cutColor = entity.cutColor;

    this.normalFont = entity.normalFont;
    this.playFont = entity.playFont;
    this.invalidFont = entity.invalidFont;
    this.cutFont = entity.cutFont;
  }
}
