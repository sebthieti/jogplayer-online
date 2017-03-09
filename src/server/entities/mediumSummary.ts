export interface IMediumSummary {
  title: string;
  index: number;
  filePath?: string;
  duration: number;
}

export default class MediumSummary implements IMediumSummary {
  index: number;
  title: string;
  filePath: string;
  duration: number;

  constructor(entity: IMediumSummary) {
    this.title = entity.title;
    this.index = entity.index;
    this.filePath = entity.filePath;
    this.duration = entity.duration;
  }

  isMediumSummary(obj: any): obj is IMediumSummary {
    return obj &&
      'title' in obj &&
      'filePath' in obj &&
      'duration' in obj;
  }
}
