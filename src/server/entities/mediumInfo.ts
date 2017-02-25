export interface IMediumInfo {
  name: string;
  fileext: string;
  detailedInfo: string;
}

export default class MediumInfo implements IMediumInfo {
  name: string;
  fileext: string;
  detailedInfo: string;

  constructor(entity: IMediumInfo) {
    this.name = entity.name;
    this.fileext = entity.fileext;
    this.detailedInfo = entity.detailedInfo;
  }
}
