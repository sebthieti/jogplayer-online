import {IColorSettings} from './colorSettings';

export interface IConfiguration {
  undoRedoStackSize: number;
  colorSettings: IColorSettings;
}

export default class Configuration implements IConfiguration {
  undoRedoStackSize: number;
  colorSettings: any;

  constructor(entity: IConfiguration) {
    this.undoRedoStackSize = entity.undoRedoStackSize;
    this.colorSettings = entity.colorSettings;
  }
}
